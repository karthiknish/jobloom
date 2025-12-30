"use client";

/**
 * TanStack Query Provider Component
 * 
 * Provides QueryClient context and DevTools for the application.
 * DevTools are only included in development builds.
 */

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "./queryClient";
import type { ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Get or create the query client
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
