import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

// GET /api/blog/admin/stats - Get blog statistics for admin dashboard
export const GET = withApi({
  auth: "admin",
}, async () => {
  // Get all blog posts
  const postsSnapshot = await db.collection("blogPosts").get();

  let totalPosts = 0;
  let publishedPosts = 0;
  let draftPosts = 0;
  let archivedPosts = 0;
  let totalViews = 0;
  let totalLikes = 0;
  const postsByCategory: Record<string, number> = {};

  postsSnapshot.forEach((doc) => {
    const data = doc.data();
    totalPosts++;
    totalViews += data.viewCount || 0;
    totalLikes += data.likeCount || 0;

    // Count by status
    switch (data.status) {
      case "published":
        publishedPosts++;
        break;
      case "draft":
        draftPosts++;
        break;
      case "archived":
        archivedPosts++;
        break;
    }

    // Count by category
    if (data.category) {
      postsByCategory[data.category] = (postsByCategory[data.category] || 0) + 1;
    }
  });

  const stats = {
    totalPosts,
    publishedPosts,
    draftPosts,
    archivedPosts,
    totalViews,
    totalLikes,
    postsByCategory,
  };

  return {
    stats,
    message: 'Blog statistics retrieved successfully'
  };
});
