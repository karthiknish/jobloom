// hooks/useApi.ts
import { useState, useEffect, useCallback } from "react";
import { ApiError } from "../services/api/appApi";

interface UseQueryResult<T> {
  data: T | undefined;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

interface UseMutationResult<T> {
  data: T | undefined;
  loading: boolean;
  error: ApiError | null;
  mutate: (variables: Record<string, unknown>) => Promise<T | undefined>;
}

// Custom hook to replace useQuery
export function useApiQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = []
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
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError("Unknown error", 500));
    } finally {
      setLoading(false);
    }
  }, [queryFn]);

  useEffect(() => {
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
export function useApiMutation<T>(
  mutationFn: (variables: Record<string, unknown>) => Promise<T>
): UseMutationResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = async (variables: Record<string, unknown>) => {
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