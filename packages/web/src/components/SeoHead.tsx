"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { resolveSeoMeta } from "@/seo.config";

const baseMeta = resolveSeoMeta("/");

export function SeoHead() {
  const [meta, setMeta] = useState(baseMeta);
  const pathname = usePathname();

  useEffect(() => {
    setMeta(resolveSeoMeta(pathname ?? "/"));
  }, [pathname]);

  return (
    <>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      {meta.keywords && <meta name="keywords" content={meta.keywords} />}
      {meta.noIndex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        <meta name="robots" content="index,follow" />
      )}
      <meta name="theme-color" content="#4CAF50" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="HireAll" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
        rel="stylesheet"
      />
    </>
  );
}
