"use client";

import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexReactClient, ConvexProvider as ConvexBaseProvider } from 'convex/react';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL as string;

export function ConvexAuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry: 1,
      },
    },
  }), []);

  const convexClient = useMemo(() => {
    return new ConvexReactClient(convexUrl);
  }, [convexUrl]);

  return (
    <QueryClientProvider client={queryClient}>
      <ConvexBaseProvider client={convexClient}>
        {children}
      </ConvexBaseProvider>
    </QueryClientProvider>
  );
}
