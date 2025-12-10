"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { resolveSeoMeta, getCanonicalUrl, getOgImageUrl, SITE_URL } from "@/seo.config";

const baseMeta = resolveSeoMeta("/");

export function SeoHead() {
  const [meta, setMeta] = useState(baseMeta);
  const [canonicalUrl, setCanonicalUrl] = useState(SITE_URL);
  const pathname = usePathname();

  useEffect(() => {
    const currentPath = pathname ?? "/";
    setMeta(resolveSeoMeta(currentPath));
    setCanonicalUrl(getCanonicalUrl(currentPath));
  }, [pathname]);

  const ogImageUrl = getOgImageUrl(meta.ogImage);

  return (
    <>
      {/* Primary Meta Tags */}
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      {meta.keywords && <meta name="keywords" content={meta.keywords} />}
      
      {/* Robots */}
      {meta.noIndex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
      )}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={meta.ogType || "website"} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="HireAll" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={ogImageUrl} />
      <meta name="twitter:site" content="@hireall" />
      <meta name="twitter:creator" content="@hireall" />
      
      {/* Additional Meta Tags */}
      <meta name="author" content="HireAll" />
      <meta name="generator" content="Next.js" />
      <meta name="theme-color" content="#10B77F" />
      <meta name="color-scheme" content="light" />
      
      {/* Mobile & PWA */}
      <link rel="manifest" href="/manifest.json" />
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      <link rel="icon" type="image/png" href="/favicon-16x16.png" sizes="16x16" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="HireAll" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      
      {/* Preconnect for Performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
        rel="stylesheet"
      />
      
      {/* DNS Prefetch for External Resources */}
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
    </>
  );
}
