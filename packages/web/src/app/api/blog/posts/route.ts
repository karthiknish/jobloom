import { NextRequest, NextResponse } from "next/server";
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

// GET /api/blog/posts - Get published blog posts with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const category = url.searchParams.get("category");
    const tag = url.searchParams.get("tag");
    const search = url.searchParams.get("search");

    let query = db.collection("blogPosts").where("status", "==", "published");

    // Apply filters
    if (category) {
      query = query.where("category", "==", category);
    }

    let snapshot;

    if (search) {
      // For search, we'll get all posts and filter client-side
      // In a production app, you might want to use Algolia or Elasticsearch
      snapshot = await query.orderBy("publishedAt", "desc").get();
      const posts = snapshot.docs
        .map((doc) => ({
          _id: doc.id,
          ...doc.data(),
        }))
        .filter((post: any) =>
          post.title.toLowerCase().includes(search.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(search.toLowerCase()) ||
          post.content.toLowerCase().includes(search.toLowerCase())
        );

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedPosts = posts.slice(startIndex, startIndex + limit);

      return NextResponse.json({
        posts: paginatedPosts,
        pagination: {
          page,
          limit,
          total: posts.length,
          pages: Math.ceil(posts.length / limit),
        },
      });
    } else {
      // Apply sorting and pagination for non-search queries
      snapshot = await query.orderBy("publishedAt", "desc").limit(limit * page).get();

      const posts = snapshot.docs.slice((page - 1) * limit).map((doc) => ({
        _id: doc.id,
        ...doc.data(),
      }));

      // Get total count for pagination
      const totalSnapshot = await query.count().get();
      const total = totalSnapshot.data().count;

      return NextResponse.json({
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    }
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
