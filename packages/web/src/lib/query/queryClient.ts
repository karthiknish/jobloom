"use client";

/**
 * TanStack Query Client Configuration
 * 
 * This module configures the QueryClient with:
 * - Default stale time and cache time
 * - Retry logic with exponential backoff
 * - Global error handling integration
 * - Window focus refetching
 */

import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { ApiError } from "@hireall/shared";
import { showError } from "@/components/ui/Toast";

/**
 * Determine if an error should trigger a retry
 */
function shouldRetryOnError(error: unknown): boolean {
  if (error instanceof ApiError) {
    // Don't retry client errors (4xx) except rate limiting
    if (error.status >= 400 && error.status < 500) {
      return error.status === 429; // Only retry rate limits
    }
    // Retry server errors (5xx)
    return error.status >= 500;
  }
  // Retry unknown errors (network issues, etc.)
  return true;
}

/**
 * Calculate retry delay with exponential backoff
 */
function getRetryDelay(attemptIndex: number, error: unknown): number {
  // If rate limited, use the retry-after header if available
  if (error instanceof ApiError && error.retryAfter) {
    return error.retryAfter * 1000;
  }
  // Exponential backoff: 1s, 2s, 4s, with max 30s
  return Math.min(1000 * 2 ** attemptIndex, 30000);
}

/**
 * Handle global query errors
 */
function handleQueryError(error: unknown) {
  // Only show toast for non-silent errors
  if (error instanceof ApiError) {
    // Skip showing errors for specific codes that components handle themselves
    const silentCodes = ["NOT_FOUND", "UNAUTHORIZED"];
    if (!silentCodes.includes(error.code)) {
      showError(error.message);
    }
  }
}

/**
 * Handle global mutation errors
 */
function handleMutationError(error: unknown) {
  if (error instanceof ApiError) {
    showError(error.message);
  } else if (error instanceof Error) {
    showError(error.message);
  } else {
    showError("An unexpected error occurred");
  }
}

/**
 * Create and configure the QueryClient
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Only show error toast if the query has already been loaded once
        // This prevents showing errors on initial load failures (component handles those)
        if (query.state.data !== undefined) {
          handleQueryError(error);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        handleMutationError(error);
      },
    }),
    defaultOptions: {
      queries: {
        // Data is considered fresh for 30 seconds
        staleTime: 30 * 1000,
        // Cache data for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry configuration
        retry: (failureCount, error) => {
          // Max 3 retries
          if (failureCount >= 3) return false;
          return shouldRetryOnError(error);
        },
        retryDelay: getRetryDelay,
        // Refetch on window focus for fresh data
        refetchOnWindowFocus: true,
        // Don't refetch on mount if data is still fresh
        refetchOnMount: true,
        // Refetch on reconnect
        refetchOnReconnect: true,
      },
      mutations: {
        // Retry mutations once on server errors
        retry: (failureCount, error) => {
          if (failureCount >= 1) return false;
          return shouldRetryOnError(error);
        },
        retryDelay: getRetryDelay,
      },
    },
  });
}

// Create singleton instance
// We use a function to ensure SSR compatibility
let queryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create a new QueryClient
    return createQueryClient();
  }
  // Browser: create once and reuse
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
}

// Export for direct use where needed
export { QueryClient };
