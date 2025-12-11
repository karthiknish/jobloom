import type { MetadataRoute } from "next";
import { headers } from "next/headers";

async function getRequestBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "hireall.app";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL || "https://hireall.app";

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/career-tools`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/volunteer`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/upgrade`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/conditions`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Blog posts (published only)
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const baseUrl = await getRequestBaseUrl();
    const res = await fetch(`${baseUrl}/api/blog/slugs`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = (await res.json()) as { slugs?: string[] };
      const slugs = Array.isArray(data.slugs) ? data.slugs : [];
      blogEntries = slugs
        .filter((slug) => typeof slug === "string" && slug.length > 0)
        .map((slug) => ({
          url: `${siteUrl}/blog/${encodeURIComponent(slug)}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        }));
    }
  } catch {
    // If Firestore/admin isn’t available in some environments, fall back to static entries.
  }

  return [...staticEntries, ...blogEntries];
}
