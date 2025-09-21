import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, isUserAdmin } from "@/firebase/admin";
import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

// GET /api/blog/admin/stats - Get blog statistics for admin dashboard
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(decodedToken.uid);
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
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
    const recentPosts: any[] = [];

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
      const category = data.category || "Uncategorized";
      postsByCategory[category] = (postsByCategory[category] || 0) + 1;

      // Collect recent posts (last 5)
      if (recentPosts.length < 5) {
        recentPosts.push({
          _id: doc.id,
          title: data.title,
          status: data.status,
          createdAt: data.createdAt?.toMillis() || Date.now(),
          publishedAt: data.publishedAt?.toMillis(),
        });
      }
    });

    // Sort recent posts by creation date
    recentPosts.sort((a, b) => b.createdAt - a.createdAt);

    const stats = {
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
      totalViews,
      totalLikes,
      postsByCategory,
      recentPosts,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching blog stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
