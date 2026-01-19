"use client";

import { useMemo } from 'react';
import { ConvexReactClient } from 'convex/react';

export function useConvexAuth() {
  const convex = useMemo(() => {
    return new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);
  }, []);

  return { convex };
}
