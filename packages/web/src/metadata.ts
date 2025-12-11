import type { Metadata } from "next";
import { resolveSeoMeta, getCanonicalUrl, getOgImageUrl, SITE_URL } from "./seo.config";

/**
 * Generate Next.js Metadata object for a given pathname
 * This provides server-side rendered meta tags for better SEO
 */
export function generatePageMetadata(
  pathname: string,
  override?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
    noIndex?: boolean;
  }
): Metadata {
  const seoMeta = resolveSeoMeta(pathname, override);
  const canonicalUrl = getCanonicalUrl(pathname);
  const ogImageUrl = getOgImageUrl(seoMeta.ogImage);

  const metadata: Metadata = {
    title: seoMeta.title,
    description: seoMeta.description,
    keywords: seoMeta.keywords,
    authors: [{ name: "HireAll" }],
    creator: "HireAll",
    publisher: "HireAll",
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: seoMeta.ogType === "article" ? "article" : seoMeta.ogType === "profile" ? "profile" : "website",
      url: canonicalUrl,
      title: seoMeta.title,
      description: seoMeta.description,
      siteName: "HireAll",
      locale: "en_US",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: seoMeta.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoMeta.title,
      description: seoMeta.description,
      images: [ogImageUrl],
      site: "@hireall",
      creator: "@hireall",
    },
    robots: seoMeta.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png" }],
    },
    manifest: "/manifest.json",
    other: {
      "theme-color": "#10B77F",
      "color-scheme": "light",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "apple-mobile-web-app-title": "HireAll",
      "format-detection": "telephone=no",
      "mobile-web-app-capable": "yes",
    },
  };

  return metadata;
}

/**
 * Default metadata for the root layout
 */
export const rootMetadata: Metadata = generatePageMetadata("/");
