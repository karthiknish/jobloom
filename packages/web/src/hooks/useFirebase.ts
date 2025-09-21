// Comprehensive Firebase hooks with enhanced error handling, retry logic, and connection management
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getConnectionState, addConnectionListener, type FirebaseConnectionState } from '@/firebase/client';
import { showError, showSuccess } from '@/components/ui/Toast';

export interface FirebaseHookOptions {
  retryAttempts?: number;
  retryDelay?: number;
  enableOfflineRetry?: boolean;
  showToasts?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

export interface FirebaseHookState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isConnected: boolean;
  retryCount: number;
  lastUpdated: number | null;
}

export interface FirebaseMutationState {
  loading: boolean;
  error: Error | null;
  isConnected: boolean;
  retryCount: number;
  lastAttempt: number | null;
}

// Base hook for Firebase operations
export function useFirebaseOperation<T>(
  operation: () => Promise<T>,
  deps: any[] = [],
  options: FirebaseHookOptions = {}
) {
  const {
    retryAttempts = 3,
    retryDelay = 1000,
    enableOfflineRetry = true,
    showToasts = true,
    onError,
    onSuccess,
  } = options;

  const [state, setState] = useState<FirebaseHookState<T>>({
    data: null,
    loading: false,
    error: null,
    isConnected: true,
    retryCount: 0,
    lastUpdated: null,
  });

  const operationRef = useRef(operation);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update operation ref when it changes
  useEffect(() => {
    operationRef.current = operation;
  }, [operation]);

  // Monitor connection state
  useEffect(() => {
    const unsubscribe = addConnectionListener((connectionState) => {
      setState(prev => ({ ...prev, isConnected: connectionState.isConnected }));

      // Retry failed operations when connection is restored
      if (connectionState.isConnected && enableOfflineRetry && state.error && !state.loading) {
        executeOperation();
      }
    });

    return unsubscribe;
  }, [enableOfflineRetry, state.error, state.loading]);

  const executeOperation = useCallback(async (isRetry = false) => {
    // Create new abort controller for this operation
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: isRetry ? null : prev.error,
      retryCount: isRetry ? prev.retryCount + 1 : 0,
    }));

    let attempt = 0;
    const maxAttempts = isRetry ? 1 : retryAttempts;

    const performOperation = async (): Promise<void> => {
      try {
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const connectionState = getConnectionState();
        if (!connectionState.isConnected && !enableOfflineRetry) {
          throw new Error('No internet connection');
        }

        const result = await operationRef.current();

        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        setState(prev => ({
          ...prev,
          data: result,
          loading: false,
          error: null,
          lastUpdated: Date.now(),
        }));

        onSuccess?.(result);

        if (showToasts && !isRetry) {
          showSuccess('Operation completed successfully');
        }
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const errorObj = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < maxAttempts - 1) {
          attempt++;
          const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff

          retryTimeoutRef.current = setTimeout(() => {
            performOperation();
          }, delay);

          setState(prev => ({
            ...prev,
            retryCount: attempt,
          }));

          return;
        }

        setState(prev => ({
          ...prev,
          loading: false,
          error: errorObj,
        }));

        onError?.(errorObj);

        if (showToasts) {
          showError(errorObj.message);
        }
      }
    };

    await performOperation();
  }, [retryAttempts, retryDelay, enableOfflineRetry, onError, onSuccess, showToasts]);

  // Execute operation when dependencies change
  useEffect(() => {
    executeOperation();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual refresh
  const refresh = useCallback(() => {
    executeOperation();
  }, [executeOperation]);

  // Cancel current operation
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setState(prev => ({ ...prev, loading: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    ...state,
    refresh,
    cancel,
  };
}

// Mutation hook for Firebase operations that modify data
export function useFirebaseMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: FirebaseHookOptions = {}
) {
  const {
    retryAttempts = 2,
    retryDelay = 1000,
    enableOfflineRetry = false,
    showToasts = true,
    onError,
    onSuccess,
  } = options;

  const [state, setState] = useState<FirebaseMutationState>({
    loading: false,
    error: null,
    isConnected: true,
    retryCount: 0,
    lastAttempt: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Monitor connection state
  useEffect(() => {
    const unsubscribe = addConnectionListener((connectionState) => {
      setState(prev => ({ ...prev, isConnected: connectionState.isConnected }));
    });

    return unsubscribe;
  }, []);

  const mutate = useCallback(async (variables: TVariables) => {
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      lastAttempt: Date.now(),
    }));

    let attempt = 0;
    const maxAttempts = retryAttempts;

    const performMutation = async (): Promise<TData | null> => {
      try {
        if (abortControllerRef.current?.signal.aborted) {
          return null;
        }

        const connectionState = getConnectionState();
        if (!connectionState.isConnected && !enableOfflineRetry) {
          throw new Error('No internet connection. Please check your connection and try again.');
        }

        const result = await mutationFn(variables);

        if (abortControllerRef.current?.signal.aborted) {
          return null;
        }

        setState(prev => ({
          ...prev,
          loading: false,
          error: null,
          retryCount: 0,
        }));

        onSuccess?.(result);

        if (showToasts) {
          showSuccess('Operation completed successfully');
        }

        return result;
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) {
          return null;
        }

        const errorObj = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < maxAttempts - 1) {
          attempt++;
          const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff

          await new Promise(resolve => setTimeout(resolve, delay));
          return performMutation();
        }

        setState(prev => ({
          ...prev,
          loading: false,
          error: errorObj,
          retryCount: attempt,
        }));

        onError?.(errorObj);

        if (showToasts) {
          showError(errorObj.message);
        }

        throw errorObj;
      }
    };

    return performMutation();
  }, [mutationFn, retryAttempts, retryDelay, enableOfflineRetry, onError, onSuccess, showToasts]);

  // Cancel current mutation
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(prev => ({ ...prev, loading: false }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      isConnected: getConnectionState().isConnected,
      retryCount: 0,
      lastAttempt: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    cancel,
    reset,
  };
}

// Hook for Firebase connection state
export function useFirebaseConnection(): FirebaseConnectionState {
  const [state, setState] = useState<FirebaseConnectionState>(getConnectionState);

  useEffect(() => {
    const unsubscribe = addConnectionListener(setState);
    return unsubscribe;
  }, []);

  return state;
}

// Hook for offline-aware operations
export function useOfflineAware<T>(
  operation: () => Promise<T>,
  offlineFallback?: T,
  options: FirebaseHookOptions = {}
) {
  const connection = useFirebaseConnection();

  const offlineAwareOperation = useCallback(async () => {
    if (!connection.isConnected) {
      if (offlineFallback !== undefined) {
        return offlineFallback;
      }
      throw new Error('Operation requires internet connection');
    }
    return operation();
  }, [operation, connection.isConnected, offlineFallback]);

  return useFirebaseOperation(offlineAwareOperation, [connection.isConnected], {
    ...options,
    enableOfflineRetry: true,
  });
}

// Hook for optimistic updates
export function useOptimisticFirebaseMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  onOptimisticUpdate?: (variables: TVariables) => void,
  onRollback?: (variables: TVariables) => void,
  options: FirebaseHookOptions = {}
) {
  const mutation = useFirebaseMutation(mutationFn, {
    ...options,
    showToasts: false, // We'll handle success/error toasts manually
  });

  const mutateOptimistically = useCallback(async (variables: TVariables) => {
    // Apply optimistic update
    onOptimisticUpdate?.(variables);

    try {
      const result = await mutation.mutate(variables);
      options.onSuccess?.(result);
      if (options.showToasts) {
        showSuccess('Operation completed successfully');
      }
      return result;
    } catch (error) {
      // Rollback optimistic update
      onRollback?.(variables);
      throw error;
    }
  }, [mutation, onOptimisticUpdate, onRollback, options]);

  return {
    ...mutation,
    mutate: mutateOptimistically,
  };
}

// Hook for debounced operations
export function useDebouncedFirebaseOperation<T>(
  operation: () => Promise<T>,
  delay: number,
  deps: any[] = []
) {
  const [debouncedOperation, setDebouncedOperation] = useState<() => Promise<T>>(() => operation);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedOperation(() => operation);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [operation, delay]);

  const result = useFirebaseOperation(debouncedOperation, deps);

  return result;
}

// Hook for Firebase operations with caching
export function useCachedFirebaseOperation<T>(
  operation: () => Promise<T>,
  cacheKey: string,
  cacheExpiry: number = 5 * 60 * 1000, // 5 minutes
  deps: any[] = []
) {
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  const cachedOperation = useCallback(async () => {
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < cacheExpiry) {
      return cached.data;
    }

    const result = await operation();
    cacheRef.current.set(cacheKey, { data: result, timestamp: now });
    return result;
  }, [operation, cacheKey, cacheExpiry]);

  const result = useFirebaseOperation(cachedOperation, deps);

  const invalidateCache = useCallback(() => {
    cacheRef.current.delete(cacheKey);
  }, [cacheKey]);

  return {
    ...result,
    invalidateCache,
  };
}

// Hook for Firebase operations with polling
export function usePolledFirebaseOperation<T>(
  operation: () => Promise<T>,
  interval: number,
  deps: any[] = []
) {
  const result = useFirebaseOperation(operation, deps);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      result.refresh();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [result, interval]);

  return result;
}
