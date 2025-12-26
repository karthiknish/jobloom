"use client";

import * as React from "react";

export type SafeImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  fallbackSrc?: string;
};

export function SafeImg({
  src,
  fallbackSrc = "/images/blog-placeholder.svg",
  onError,
  referrerPolicy,
  ...props
}: SafeImgProps) {
  const normalizedSrc = typeof src === "string" && src.trim().length > 0 ? src : undefined;
  
  // Use fallback flag instead of syncing state with props
  const [useFallback, setUseFallback] = React.useState(false);
  const currentSrc = useFallback ? fallbackSrc : normalizedSrc;

  if (!currentSrc) return null;

  return (
    <img
      {...props}
      src={currentSrc}
      referrerPolicy={referrerPolicy ?? "no-referrer"}
      loading="lazy"
      decoding="async"
      onError={(event) => {
        if (!useFallback && fallbackSrc) {
          setUseFallback(true);
        }
        onError?.(event);
      }}
    />
  );
}

