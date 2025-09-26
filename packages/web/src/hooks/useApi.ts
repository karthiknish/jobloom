// hooks/useApi.ts
import { useState, useEffect, useCallback } from "react";
import { ApiError } from "../services/api/appApi";

interface UseQueryOptions {
  enabled?: boolean;
}

interface UseQueryResult<T> {
  data: T | undefined;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

interface UseMutationResult<T, V = Record<string, unknown>> {
  data: T | undefined;
  loading: boolean;
  error: ApiError | null;
  mutate: (variables: V) => Promise<T | undefined>;
}

// Custom hook to replace useQuery
export function useApiQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = [],
  options?: UseQueryOptions
): UseQueryResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await queryFn();
      setData(result);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err);
      } else {
        // Preserve original message if available for easier debugging
        const message = typeof err?.message === 'string' ? err.message : 'Unknown error';
        setError(new ApiError(message, 500));
      }
    } finally {
      setLoading(false);
    }
  }, [queryFn]);

  useEffect(() => {
    if (options?.enabled === false) {
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
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Custom hook to replace useMutation
export function useApiMutation<T, V = Record<string, unknown>>(
  mutationFn: (variables: V) => Promise<T>
): UseMutationResult<T, V> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = async (variables: V) => {
    try {
      setLoading(true);
      setError(null);
      const result = await mutationFn(variables);
      setData(result);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError("Unknown error", 500);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, mutate };
}