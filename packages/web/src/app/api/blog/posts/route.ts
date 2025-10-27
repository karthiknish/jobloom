import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export const runtime = "nodejs";

const MOCK_AUTHOR = {
  id: "mock-author",
  name: "HireAll Team",
  email: "team@hireall.app",
};

const MOCK_POSTS = [
  {
    _id: "mock-post-1",
    title: "How to Ace Your Technical Interview",
    slug: "how-to-ace-technical-interview",
    excerpt: "Master the art of technical interviews with these proven strategies and tips.",
    content: "Technical interviews can be challenging, but with the right preparation...",
    category: "Career Advice",
    tags: ["interview", "career", "technical"],
    status: "published",
    author: MOCK_AUTHOR,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    publishedAt: Date.now(),
    featuredImage: "https://example.com/interview.jpg",
    readingTime: 5,
    viewCount: 0,
    likeCount: 0,
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
    author: MOCK_AUTHOR,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    publishedAt: Date.now() - 86400000,
    featuredImage: "https://example.com/resume.jpg",
    readingTime: 7,
    viewCount: 0,
    likeCount: 0,
  },
];

const buildMockResponse = (status = 200, message = "Blog posts retrieved successfully (mock)") =>
  NextResponse.json(
    {
      posts: MOCK_POSTS,
      pagination: {
        page: 1,
        limit: MOCK_POSTS.length,
        total: MOCK_POSTS.length,
        pages: 1,
      },
      message,
    },
    { status },
  );

// GET /api/blog/posts - Get published blog posts with pagination and filtering
export async function GET(request: NextRequest) {
  const enableMockFallback = process.env.NEXT_PUBLIC_USE_BLOG_MOCK_FALLBACK === "false" ? false : true;
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    return buildMockResponse();
  }

  try {

    let db;
    try {
      db = getAdminDb();
    } catch (initError) {
      console.error("Failed to initialize Firestore admin instance:", initError);

      if (enableMockFallback) {
        console.warn("Falling back to mock blog posts response");
        return buildMockResponse(200, "Mock data fallback: Firestore unavailable");
      }

      return NextResponse.json(
        {
          posts: [],
          pagination: {
            page: 1,
            limit: 0,
            total: 0,
            pages: 0,
          },
          error: {
            message: "Blog service unavailable",
            code: "firestore_init_failed",
          },
        },
        { status: 503 },
      );
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const category = url.searchParams.get("category");
    const tag = url.searchParams.get("tag");
    const search = url.searchParams.get("search");

    // Start with published posts only
    let query = db.collection("blogPosts").where("status", "==", "published");

    if (category) {
      query = query.where("category", "==", category);
    }

    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.get();

    let posts = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, any>;
      return {
        _id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
        updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now(),
        publishedAt: data.publishedAt?.toMillis?.() || data.publishedAt,
      };
    });

    if (tag) {
      const tagLower = tag.toLowerCase();
      posts = posts.filter(
        (post: any) => post.tags && post.tags.some((t: string) => t.toLowerCase().includes(tagLower)),
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      posts = posts.filter((post: any) =>
        post.title.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower),
      );
    }

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

    if (enableMockFallback) {
      console.warn("Returning mock posts due to blog fetch error");
      return buildMockResponse(200, "Mock data fallback: blog fetch error");
    }

    return NextResponse.json(
      {
        posts: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 },
    );
  }
}
