import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { withErrorHandling, generateRequestId } from "@/lib/api/errors";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

// GET /api/blog/admin/stats - Get blog statistics for admin dashboard
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    const auth = await authenticateRequest(request, {
      requireAdmin: true,
      requireAuthHeader: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

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

    return NextResponse.json({
      stats,
      message: 'Blog statistics retrieved successfully'
    });
  }, {
    endpoint: '/api/blog/admin/stats',
    method: 'GET',
    requestId
  });
}
