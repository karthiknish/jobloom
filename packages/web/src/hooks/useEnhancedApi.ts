/**
 * Enhanced React Hook for API calls with comprehensive error handling
 * Integrates with the new API client and error handling system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, ApiResponseOptions } from '@/lib/api/client';
import { ApiError } from '@hireall/shared';
import { toast } from 'react-hot-toast';

// Re-export ApiError for consumers
export type { ApiError };

// Hook state interface
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  lastUpdated: number | null;
  requestId: string | null;
}

// Hook options
interface UseApiOptions extends ApiResponseOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  retryOnMount?: boolean;
  cacheTime?: number;
  retries?: number;
  retryDelay?: number;
  /**
   * When true, return stale cached data immediately while refetching in background.
   * This provides a faster perceived load time for cached resources.
   */
  staleWhileRevalidate?: boolean;
}

// Return type for the hook
interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  refetch: () => Promise<T | null>;
  requestId: string | null;
}

// Cache for storing API responses
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

/**
 * Enhanced API hook with comprehensive error handling
 */
export function useEnhancedApi<T = any>(
  apiCall: (...args: any[]) => Promise<any>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const {
    immediate = false,
    onSuccess,
    onError,
    retryOnMount = false,
    cacheTime = 5 * 60 * 1000, // 5 minutes default
    showGlobalError = true,
    showLocalError = true,
    retryOnFailure = true,
    customErrorHandler
  } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
    requestId: null
  });

  const executeRef = useRef(apiCall);
  const optionsRef = useRef(options);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasExecutedRef = useRef(false);

  // Update refs when dependencies change
  useEffect(() => {
    executeRef.current = apiCall;
  }, [apiCall]);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null,
      requestId: null
    });
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Execute API call with error handling
  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    // Cancel previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    const currentOptions = optionsRef.current;
    const {
      onSuccess: optOnSuccess,
      onError: optOnError,
      showGlobalError: optShowGlobalError = true,
      showLocalError: optShowLocalError = true,
      customErrorHandler: optCustomErrorHandler,
      cacheTime: optCacheTime = 5 * 60 * 1000,
      staleWhileRevalidate: optSWR = false
    } = currentOptions;

    try {
      // Check cache first
      const cacheKey = JSON.stringify({ fn: executeRef.current.name, args });
      const cached = apiCache.get(cacheKey);
      
      const isCacheValid = cached && Date.now() - cached.timestamp < cached.ttl;
      const isCacheStale = cached && !isCacheValid;
      
      // Return fresh cached data immediately
      if (isCacheValid) {
        setState({
          data: cached.data,
          loading: false,
          error: null,
          lastUpdated: Date.now(),
          requestId: 'cached'
        });
        
        if (optOnSuccess) optOnSuccess(cached.data);
        return cached.data;
      }
      
      // Stale-while-revalidate: return stale data immediately, refetch in background
      if (optSWR && isCacheStale) {
        setState({
          data: cached.data,
          loading: true, // Show loading indicator for background refetch
          error: null,
          lastUpdated: cached.timestamp,
          requestId: 'stale'
        });
        
        if (optOnSuccess) optOnSuccess(cached.data);
        
        // Continue to refetch in background (don't return early)
      }

      // Execute API call
      const data = await executeRef.current(...args);

      // Cache the result
      if (optCacheTime > 0) {
        apiCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: optCacheTime
        });
      }

      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
        requestId: data?.requestId || null
      });

      if (optOnSuccess) optOnSuccess(data);
      return data;

    } catch (error) {
      const apiError = error as ApiError;
      
      setState({
        data: null,
        loading: false,
        error: apiError,
        lastUpdated: Date.now(),
        requestId: apiError.requestId || null
      });

      if (optOnError) optOnError(apiError);

      // Handle error based on options
      if (!optCustomErrorHandler) {
        if (optShowLocalError && apiError.field) {
          // Field-specific error - don't show global toast
          console.warn(`Field error (${apiError.field}): ${apiError.message}`);
        } else if (optShowGlobalError) {
          // Show global error toast (with deduplication for rate limit errors)
          const isRateLimit = apiError.status === 429;
          const toastId = isRateLimit ? 'rate-limit-error' : apiError.requestId;
          
          if (isRateLimit) {
            toast.error('Too many requests. Please wait a moment before trying again.', {
              duration: 5000,
              id: toastId // Prevent duplicate rate limit toasts
            });
          } else {
            toast.error(apiError.message, {
              duration: apiError.status >= 500 ? 5000 : 3000,
              id: toastId
            });
          }
        }
      }

      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - use refs for all dependencies

  // Refetch function
  const refetch = useCallback(async (): Promise<T | null> => {
    // Clear cache for this call
    const cacheKey = JSON.stringify({ fn: executeRef.current.name, args: [] });
    apiCache.delete(cacheKey);
    
    return execute();
  }, [execute]);

  // Execute on mount if immediate (only once)
  useEffect(() => {
    const shouldExecute = (immediate || retryOnMount) && !hasExecutedRef.current;
    
    if (shouldExecute) {
      hasExecutedRef.current = true;
      execute();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, retryOnMount]); // Remove execute from dependencies - it's stable now

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
    refetch,
    requestId: state.requestId
  };
}

/**
 * Hook for GET requests
 */
export function useGet<T = any>(
  endpoint: string,
  options: UseApiOptions = {},
  requestConfig?: any
) {
  return useEnhancedApi<T>(
    async () => apiClient.get<T>(endpoint, requestConfig, options),
    options
  );
}

/**
 * Hook for POST requests
 */
export function usePost<T = any>(
  endpoint: string,
  options: UseApiOptions = {},
  requestConfig?: any
) {
  return useEnhancedApi<T>(
    async (data: any) => apiClient.post<T>(endpoint, data, requestConfig, options),
    {
      ...options,
      immediate: false // Don't execute POST requests immediately
    }
  );
}

/**
 * Hook for PUT requests
 */
export function usePut<T = any>(
  endpoint: string,
  options: UseApiOptions = {},
  requestConfig?: any
) {
  return useEnhancedApi<T>(
    async (data: any) => apiClient.put<T>(endpoint, data, requestConfig, options),
    {
      ...options,
      immediate: false
    }
  );
}

/**
 * Hook for PATCH requests
 */
export function usePatch<T = any>(
  endpoint: string,
  options: UseApiOptions = {},
  requestConfig?: any
) {
  return useEnhancedApi<T>(
    async (data: any) => apiClient.patch<T>(endpoint, data, requestConfig, options),
    {
      ...options,
      immediate: false
    }
  );
}

/**
 * Hook for DELETE requests
 */
export function useDelete<T = any>(
  endpoint: string,
  options: UseApiOptions = {},
  requestConfig?: any
) {
  return useEnhancedApi<T>(
    async () => apiClient.delete<T>(endpoint, requestConfig, options),
    {
      ...options,
      immediate: false
    }
  );
}

/**
 * Hook for file uploads
 */
export function useUpload<T = any>(
  endpoint: string,
  options: UseApiOptions = {},
  requestConfig?: any
) {
  return useEnhancedApi<T>(
    async (file: File, additionalData?: Record<string, any>) => 
      apiClient.upload<T>(endpoint, file, additionalData, requestConfig, options),
    {
      ...options,
      immediate: false
    }
  );
}

/**
 * Hook for paginated data
 */
export function usePaginatedApi<T = any>(
  endpoint: string,
  options: UseApiOptions = {},
  requestConfig?: any
) {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const { data, loading, error, execute, refetch } = useGet<{
    items: T[];
    pagination: {
      page: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>(endpoint, {
    ...options,
    onSuccess: (response) => {
      if (response?.pagination) {
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.totalItems);
      }
      if (options.onSuccess) {
        options.onSuccess(response);
      }
    }
  }, {
    ...requestConfig,
    query: {
      ...requestConfig?.query,
      page
    }
  });

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  }, [page, totalPages]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  return {
    items: data?.items || [],
    loading,
    error,
    page,
    totalPages,
    totalItems,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    nextPage,
    prevPage,
    goToPage,
    refetch: () => {
      setPage(1);
      return refetch();
    }
  };
}

/**
 * Hook for real-time data with polling
 */
export function useRealTimeApi<T = any>(
  endpoint: string,
  options: UseApiOptions & {
    pollInterval?: number;
    enabled?: boolean;
  } = {},
  requestConfig?: any
) {
  const { pollInterval = 30000, enabled = true, ...apiOptions } = options;
  const { data, loading, error, refetch } = useGet<T>(endpoint, {
    ...apiOptions,
    immediate: enabled
  }, requestConfig);

  useEffect(() => {
    if (!enabled || pollInterval <= 0) return;

    const interval = setInterval(() => {
      refetch();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [enabled, pollInterval, refetch]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

/**
 * Hook for optimistic updates
 */
export function useOptimisticApi<T = any>(
  endpoint: string,
  options: UseApiOptions = {},
  requestConfig?: any
) {
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const { data, loading, error, execute, reset } = useEnhancedApi<T>(
    async (data: any, optimisticValue?: T) => {
      if (optimisticValue !== undefined) {
        setOptimisticData(optimisticValue);
      }
      
      try {
        const result = await apiClient.post<T>(endpoint, data, requestConfig, options);
        setOptimisticData(null);
        return result;
      } catch (error) {
        setOptimisticData(null);
        throw error;
      }
    },
    options
  );

  const executeOptimistic = useCallback(async (data: any, optimisticValue: T) => {
    return execute(data, optimisticValue);
  }, [execute]);

  return {
    data: optimisticData || data,
    loading,
    error,
    execute: executeOptimistic,
    reset: () => {
      reset();
      setOptimisticData(null);
    }
  };
}

/**
 * Clear API cache
 */
export function clearApiCache(pattern?: string): void {
  if (pattern) {
    // Clear cache entries matching pattern
    for (const [key] of apiCache.entries()) {
      if (key.includes(pattern)) {
        apiCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    apiCache.clear();
  }
}

/**
 * Get cache statistics
 */
export function getApiCacheStats(): {
  size: number;
  entries: Array<{ key: string; age: number; ttl: number }>;
} {
  const entries = Array.from(apiCache.entries()).map(([key, value]) => ({
    key,
    age: Date.now() - value.timestamp,
    ttl: value.ttl
  }));

  return {
    size: apiCache.size,
    entries
  };
}

export default useEnhancedApi;
