import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

// GET /api/blog/posts - Get published blog posts with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    // In development mode, return mock blog posts to avoid Firebase index issues
    if (process.env.NODE_ENV === "development") {
      const mockPosts = [
        {
          _id: "mock-post-1",
          title: "How to Ace Your Technical Interview",
          slug: "how-to-ace-technical-interview",
          excerpt: "Master the art of technical interviews with these proven strategies and tips.",
          content: "Technical interviews can be challenging, but with the right preparation...",
          category: "Career Advice",
          tags: ["interview", "career", "technical"],
          status: "published",
          author: "HireAll Team",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          publishedAt: Date.now(),
          featuredImage: "https://example.com/interview.jpg",
          readingTime: 5
        },
        {
          _id: "mock-post-2",
          title: "Building a Standout Resume",
          slug: "building-standout-resume",
          excerpt: "Learn how to create a resume that gets noticed by recruiters.",
          content: "Your resume is your first impression with potential employers...",
          category: "Resume Tips",
          tags: ["resume", "job search", "career"],
          status: "published",
          author: "HireAll Team",
          createdAt: Date.now() - 86400000, // 1 day ago
          updatedAt: Date.now() - 86400000,
          publishedAt: Date.now() - 86400000,
          featuredImage: "https://example.com/resume.jpg",
          readingTime: 7
        }
      ];

      return NextResponse.json({
        posts: mockPosts,
        total: mockPosts.length,
        page: 1,
        limit: 10,
        totalPages: 1,
        message: 'Blog posts retrieved successfully (mock)'
      });
    }

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
