import type { MetadataRoute } from "next";
import { getAdminDb } from "@/firebase/admin";
import { SITE_URL } from "@/seo.config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/career-tools`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/volunteer`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/upgrade`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/conditions`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Blog posts (published only) - Fetch directly from Firestore
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const db = getAdminDb();
    const postsSnapshot = await db.collection("blogPosts")
      .where("status", "==", "published")
      .select("slug")
      .get();

    blogEntries = postsSnapshot.docs
      .map(doc => doc.data().slug)
      .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
      .map((slug) => ({
        url: `${SITE_URL}/blog/${encodeURIComponent(slug)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }));
  } catch (error) {
    console.error("Error generating blog sitemap entries:", error);
  }

  return [...staticEntries, ...blogEntries];
}
