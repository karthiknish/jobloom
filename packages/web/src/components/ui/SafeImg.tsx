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
  const [currentSrc, setCurrentSrc] = React.useState<string | undefined>(normalizedSrc);

  React.useEffect(() => {
    setCurrentSrc(normalizedSrc);
  }, [normalizedSrc]);

  if (!currentSrc) return null;

  return (
    <img
      {...props}
      src={currentSrc}
      referrerPolicy={referrerPolicy ?? "no-referrer"}
      onError={(event) => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}
