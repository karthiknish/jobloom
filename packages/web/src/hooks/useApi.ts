// hooks/useApi.ts
import { useState, useEffect, useCallback } from "react";
import { ApiError } from "../services/api/appApi";

// Enhanced error interface with more context
export interface EnhancedApiError extends ApiError {
  requestId?: string;
  timestamp?: number;
  field?: string;
  operation?: string;
  retryAfter?: number;
  details?: Record<string, any>;
}

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error categorization
export function categorizeError(error: ApiError | EnhancedApiError): {
  category: string;
  severity: ErrorSeverity;
  userMessage: string;
  shouldRetry: boolean;
  retryDelay?: number;
} {
  // Handle authentication-related messages first
  if (error.message.includes('No user') || error.message.includes('Not authenticated')) {
    return {
      category: 'authentication',
      severity: 'low', // Lower severity since this is expected during auth flow
      userMessage: '',
      shouldRetry: false
    };
  }

  if (error.status >= 500) {
    return {
      category: 'server',
      severity: 'high',
      userMessage: 'Server error. Please try again later.',
      shouldRetry: true,
      retryDelay: 5000
    };
  }

  if (error.status === 429) {
    return {
      category: 'rate_limit',
      severity: 'medium',
      userMessage: 'Too many requests. Please wait before trying again.',
      shouldRetry: true,
      retryDelay: (error as EnhancedApiError).retryAfter ? (error as EnhancedApiError).retryAfter! * 1000 : 60000
    };
  }

  if (error.status === 401) {
    return {
      category: 'authentication',
      severity: 'high',
      userMessage: 'Please sign in to continue.',
      shouldRetry: false
    };
  }

  if (error.status === 403) {
    return {
      category: 'authorization',
      severity: 'high',
      userMessage: 'You don\'t have permission to access this resource.',
      shouldRetry: false
    };
  }

  if (error.status === 404) {
    return {
      category: 'not_found',
      severity: 'low',
      userMessage: 'The requested resource was not found.',
      shouldRetry: false
    };
  }

  if (error.status >= 400) {
    return {
      category: 'client',
      severity: 'medium',
      userMessage: error.message || 'Invalid request. Please check your input.',
      shouldRetry: false
    };
  }

  return {
    category: 'unknown',
    severity: 'medium',
    userMessage: 'An unexpected error occurred. Please try again.',
    shouldRetry: true,
    retryDelay: 2000
  };
}

interface UseQueryOptions {
  enabled?: boolean;
  retry?: boolean;
  retryCount?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: EnhancedApiError) => void;
}

interface UseQueryResult<T> {
  data: T | undefined;
  loading: boolean;
  error: EnhancedApiError | null;
  refetch: () => void;
  retry: () => void;
  errorInfo: ReturnType<typeof categorizeError> | null;
}

interface UseMutationResult<T, V = Record<string, unknown>> {
  data: T | undefined;
  loading: boolean;
  error: EnhancedApiError | null;
  mutate: (variables: V) => Promise<T | undefined>;
  reset: () => void;
  errorInfo: ReturnType<typeof categorizeError> | null;
}

// Error logging utility
function logApiError(error: EnhancedApiError, context?: {
  operation?: string;
  endpoint?: string;
  variables?: any;
  retryCount?: number;
  key?: string;
}) {
  // Add contextual information to the error message for better debugging
  let enhancedMessage = error.message;
  
  if (error.message.includes('Missing or insufficient permissions')) {
    enhancedMessage = `Firebase permission error: ${error.message}. This usually means the service account lacks access to the requested resource, or the user doesn't have proper permissions. Check Firestore security rules and service account configuration.`;
  } else if (error.status === 403) {
    enhancedMessage = `Access forbidden: ${error.message}. The user or service account may not have permission to access this resource.`;
  } else if (error.status === 401) {
    enhancedMessage = `Authentication required: ${error.message}. The user needs to be authenticated to access this resource.`;
  }

  const logData = {
    error: {
      name: error.name,
      message: enhancedMessage,
      originalMessage: error.message,
      status: error.status,
      code: error.code,
      requestId: error.requestId,
      timestamp: error.timestamp
    },
    context,
    timestamp: new Date().toISOString()
  };

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 API Error:', JSON.stringify(logData, null, 2));
  }

  // TODO: Send to error monitoring service
  // sendToErrorMonitoring(logData);
}

// Enhanced custom hook for API queries
export function useApiQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = [],
  options: UseQueryOptions = {},
  key?: string
): UseQueryResult<T> {
  const {
    enabled = true,
    retry: shouldRetry = true,
    retryCount: maxRetries = 3,
    retryDelay: retryDelayMs = 1000,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<EnhancedApiError | null>(null);
  const [currentRetryCount, setCurrentRetryCount] = useState(0);

  const fetchData = useCallback(async (isRetry = false) => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const result = await queryFn();
      setData(result);
      setCurrentRetryCount(0);
      onSuccess?.(result);
    } catch (err: any) {
      const enhancedError: EnhancedApiError = err instanceof ApiError
        ? { ...err }
        : new ApiError(typeof err?.message === 'string' ? err.message : 'Unknown error', 500) as EnhancedApiError;

      // Add retry information
      const errorInfo = categorizeError(enhancedError);
      enhancedError.timestamp = Date.now();
      enhancedError.requestId = enhancedError.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      setError(enhancedError);
      
      // Only log errors that are not authentication-related or are unexpected
      if (!enhancedError.message.includes('No user') && 
          !enhancedError.message.includes('Not authenticated') &&
          enhancedError.status !== 401) {
        logApiError(enhancedError, {
          operation: 'query',
          retryCount: isRetry ? currentRetryCount + 1 : 0,
          key
        });
      }

      onError?.(enhancedError);

      // Auto-retry logic (don't retry authentication errors)
      if (shouldRetry && errorInfo.shouldRetry && currentRetryCount < maxRetries && 
          !enhancedError.message.includes('No user') && 
          !enhancedError.message.includes('Not authenticated') &&
          enhancedError.status !== 401) {
        const delay = errorInfo.retryDelay || retryDelayMs * Math.pow(2, currentRetryCount);
        setTimeout(() => {
          setCurrentRetryCount(prev => prev + 1);
          fetchData(true);
        }, delay);
      }
    } finally {
      setLoading(false);
    }
  }, [queryFn, enabled, shouldRetry, currentRetryCount, maxRetries, retryDelayMs, onSuccess, onError]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    fetchData().then(() => {
      if (!isMounted) return;
    });
    return () => {
      isMounted = false;
    };
  }, [fetchData, enabled, ...deps]);

  const refetch = useCallback(() => {
    setCurrentRetryCount(0);
    fetchData();
  }, [fetchData]);

  const retryFunction = useCallback(() => {
    const errorInfo = error ? categorizeError(error) : null;
    if (errorInfo?.shouldRetry) {
      setCurrentRetryCount(0);
      fetchData(true);
    }
  }, [error, fetchData]);

  const errorInfo = error ? categorizeError(error) : null;

  return { data, loading, error, refetch, retry: retryFunction, errorInfo };
}

// Enhanced custom hook for API mutations
export function useApiMutation<T, V = Record<string, unknown>>(
  mutationFn: (variables: V) => Promise<T>,
  options: {
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: EnhancedApiError, variables: V) => void;
  } = {},
  key?: string
): UseMutationResult<T, V> {
  const { onSuccess, onError } = options;

  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<EnhancedApiError | null>(null);

  const mutate = async (variables: V) => {
    try {
      setLoading(true);
      setError(null);

      const result = await mutationFn(variables);
      setData(result);
      onSuccess?.(result, variables);
      return result;
    } catch (err: any) {
      const enhancedError: EnhancedApiError = err instanceof ApiError
        ? { ...err }
        : new ApiError("Unknown error", 500) as EnhancedApiError;

      enhancedError.timestamp = Date.now();
      enhancedError.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      setError(enhancedError);
      logApiError(enhancedError, {
        operation: 'mutation',
        variables,
        key
      });

      onError?.(enhancedError, variables);
      throw enhancedError;
    } finally {
      setLoading(false);
    }
  };

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setLoading(false);
  }, []);

  const errorInfo = error ? categorizeError(error) : null;

  return { data, loading, error, mutate, reset, errorInfo };
}

// Hook for handling multiple API calls in parallel
export function useParallelQueries<T extends Record<string, () => Promise<any>>>(
  queries: T,
  deps: unknown[] = [],
  options: UseQueryOptions = {}
) {
  const [data, setData] = useState<Record<keyof T, any>>({} as any);
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<keyof T, EnhancedApiError | null>>({} as any);

  const fetchAll = useCallback(async () => {
    if (!options.enabled) return;

    try {
      setLoading(true);
      setErrors({} as Record<keyof T, EnhancedApiError | null>);

      const promises = Object.entries(queries).map(async ([key, queryFn]) => {
        try {
          const result = await queryFn();
          return { key, result, error: null };
        } catch (error: any) {
          const enhancedError: EnhancedApiError = error instanceof ApiError
            ? { ...error }
            : new ApiError("Unknown error", 500) as EnhancedApiError;

          enhancedError.timestamp = Date.now();
          logApiError(enhancedError, { operation: 'parallel_query', key: String(key) });
          return { key, result: null, error: enhancedError };
        }
      });

      const results = await Promise.all(promises);
      const newData: Partial<Record<keyof T, any>> = {};
      const newErrors: Partial<Record<keyof T, EnhancedApiError | null>> = {};

      results.forEach(({ key, result, error }) => {
        if (result !== null) {
          newData[key as keyof T] = result;
        }
        if (error !== null) {
          newErrors[key as keyof T] = error;
        }
      });

      setData(newData as Record<keyof T, any>);
      setErrors(newErrors as Record<keyof T, EnhancedApiError | null>);
      options.onSuccess?.(newData as Record<string, any>);
    } catch (error) {
      console.error('Parallel query error:', error);
    } finally {
      setLoading(false);
    }
  }, [queries, options.enabled, options.onSuccess]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refetch = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, loading, errors, refetch };
}

// Utility hook for retrying failed requests
export function useRetry(error: EnhancedApiError | null, options: {
  maxRetries?: number;
  delay?: number;
  onRetry?: (attempt: number) => void;
} = {}) {
  const { maxRetries = 3, delay = 1000, onRetry } = options;
  const [retryCount, setRetryCount] = useState(0);

  const shouldRetry = error &&
    error.status !== 401 &&
    error.status !== 403 &&
    error.status !== 404 &&
    retryCount < maxRetries;

  const retry = useCallback(() => {
    if (shouldRetry) {
      setRetryCount(prev => prev + 1);
      onRetry?.(retryCount + 1);
      return delay;
    }
    return null;
  }, [shouldRetry, retryCount, delay, onRetry]);

  const reset = useCallback(() => {
    setRetryCount(0);
  }, []);

  return { retry, reset, shouldRetry, retryCount };
}