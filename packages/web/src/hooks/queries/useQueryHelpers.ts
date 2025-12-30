/**
 * Query Helpers and Utilities
 * 
 * Common utilities for working with TanStack Query in this application.
 */

import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiClient } from "@/lib/api/client";

/**
 * Default query options presets for common use cases
 */
export const queryPresets = {
  /**
   * For data that rarely changes (e.g., configuration, static content)
   * Stale time: 5 minutes, refetch on mount only
   */
  static: {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },

  /**
   * For data that changes frequently (e.g., dashboard stats)
   * Stale time: 10 seconds, always refetch
   */
  realtime: {
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  },

  /**
   * For user-specific data that should stay fresh
   * Stale time: 1 minute
   */
  user: {
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },

  /**
   * For search/filter results that change with input
   * Short stale time, no background refetch
   */
  search: {
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },

  /**
   * For paginated lists
   * Keep previous data while fetching next page
   */
  paginated: {
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  },
} as const;

/**
 * Hook for invalidating queries with a convenient API
 * 
 * @example
 * const { invalidate, invalidateAll } = useInvalidateQueries();
 * 
 * // Invalidate specific query
 * invalidate(['blogs', 'detail', 'my-post']);
 * 
 * // Invalidate all blog queries
 * invalidateAll(['blogs']);
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(
    (queryKey: QueryKey) => {
      return queryClient.invalidateQueries({ queryKey });
    },
    [queryClient]
  );

  const invalidateAll = useCallback(
    (queryKey: QueryKey) => {
      return queryClient.invalidateQueries({ queryKey, exact: false });
    },
    [queryClient]
  );

  const refetch = useCallback(
    (queryKey: QueryKey) => {
      return queryClient.refetchQueries({ queryKey });
    },
    [queryClient]
  );

  const removeQueries = useCallback(
    (queryKey: QueryKey) => {
      return queryClient.removeQueries({ queryKey });
    },
    [queryClient]
  );

  const setQueryData = useCallback(
    <T,>(queryKey: QueryKey, updater: T | ((old: T | undefined) => T)) => {
      return queryClient.setQueryData(queryKey, updater);
    },
    [queryClient]
  );

  return {
    invalidate,
    invalidateAll,
    refetch,
    removeQueries,
    setQueryData,
    queryClient,
  };
}

/**
 * Common query function wrapper that uses the API client
 * 
 * @example
 * useQuery({
 *   queryKey: queryKeys.blogs.all(),
 *   queryFn: () => fetchApi('/api/blogs'),
 * });
 */
export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return apiClient.request<T>(endpoint, {
    method: options?.method || "GET",
    body: options?.body ? JSON.stringify(options.body) : undefined,
    headers: options?.headers as Record<string, string>,
  });
}

/**
 * Type helper for query options
 */
export type QueryOptions<T> = {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number | false;
  retry?: boolean | number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
};

/**
 * Type helper for mutation options
 */
export type MutationOptions<TData, TVariables> = {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
  onMutate?: (variables: TVariables) => Promise<unknown> | unknown;
};
