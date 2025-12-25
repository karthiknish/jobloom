import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";

/**
 * GET /api/blog/slugs
 * Returns all published blog post slugs for sitemap generation
 */
export const GET = withApi({
  auth: "none",
}, async () => {
  let db;
  try {
    db = getAdminDb();
  } catch (e) {
    const response = NextResponse.json({ slugs: [], count: 0 });
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return response;
  }
  
  const postsSnapshot = await db.collection("blogPosts")
    .where("status", "==", "published")
    .select("slug")
    .get();

  const slugs = postsSnapshot.docs
    .map(doc => doc.data().slug)
    .filter(Boolean);

  const response = NextResponse.json({
    slugs,
    count: slugs.length,
  });

  response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  
  return response;
});
