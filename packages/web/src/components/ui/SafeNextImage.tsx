"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";

export type SafeNextImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallbackSrc?: string;
};

export function SafeNextImage({
  src,
  fallbackSrc = "/images/blog-placeholder.svg",
  onError,
  ...props
}: SafeNextImageProps) {
  const normalizedSrc = typeof src === "string" && src.trim().length > 0 ? src : undefined;
  
  // Use ref to track if we've already fallen back (avoids re-render loops)
  const [useFallback, setUseFallback] = React.useState(false);
  
  // Removed: useEffect that synced currentSrc with normalizedSrc
  // This was an anti-pattern - we can derive the value directly
  
  // Reset fallback state when src changes
  const currentSrc = useFallback ? fallbackSrc : normalizedSrc;

  if (!currentSrc) return null;

  return (
    <Image
      {...props}
      src={currentSrc}
      onError={(event) => {
        if (!useFallback && fallbackSrc) {
          setUseFallback(true);
        }
        // next/image forwards events to the underlying <img>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError?.(event as any);
      }}
    />
  );
}

