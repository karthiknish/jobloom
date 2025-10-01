import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

// GET /api/blog/posts - Get published blog posts with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const category = url.searchParams.get("category");
    const tag = url.searchParams.get("tag");
    const search = url.searchParams.get("search");

    // Start with published posts only
    let query = db.collection("blogPosts").where("status", "==", "published");

    // Apply category filter
    if (category) {
      query = query.where("category", "==", category);
    }

    // Order by creation date (newest first)
    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.get();

    // Convert documents to blog post objects
    let posts = snapshot.docs.map((doc) => {
      const data = doc.data() as any;
      return {
        _id: doc.id,
        ...data,
        // Convert Firestore timestamps to milliseconds for frontend compatibility
        createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
        updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now(),
        publishedAt: data.publishedAt?.toMillis?.() || data.publishedAt,
      };
    });

    // Apply tag filter (client-side since Firestore doesn't support array-contains with multiple filters in this query structure)
    if (tag) {
      posts = posts.filter((post: any) => 
        post.tags && post.tags.some((t: string) => t.toLowerCase().includes(tag.toLowerCase()))
      );
    }

    // Apply search filter (client-side for full-text search)
    if (search) {
      const searchLower = search.toLowerCase();
      posts = posts.filter((post: any) =>
        post.title.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower)
      );
    }

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
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json({
      posts: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      },
    });
  }
}
