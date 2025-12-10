import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

/**
 * GET /api/blog/slugs
 * Returns all published blog post slugs for sitemap generation
 */
export async function GET() {
  try {
    const db = getAdminDb();
    
    const postsSnapshot = await db.collection("blogPosts")
      .where("status", "==", "published")
      .select("slug")
      .get();

    const slugs = postsSnapshot.docs
      .map(doc => doc.data().slug)
      .filter(Boolean);

    return NextResponse.json({
      slugs,
      count: slugs.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error("Error fetching blog slugs:", error);
    return NextResponse.json(
      { slugs: [], error: "Failed to fetch slugs" },
      { status: 500 }
    );
  }
}
