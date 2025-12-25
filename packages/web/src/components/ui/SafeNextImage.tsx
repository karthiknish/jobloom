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
  const [currentSrc, setCurrentSrc] = React.useState<string | undefined>(normalizedSrc);

  React.useEffect(() => {
    setCurrentSrc(normalizedSrc);
  }, [normalizedSrc]);

  if (!currentSrc) return null;

  return (
    <Image
      {...props}
      src={currentSrc}
      onError={(event) => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        // next/image forwards events to the underlying <img>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError?.(event as any);
      }}
    />
  );
}
