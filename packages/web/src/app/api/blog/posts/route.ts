import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";

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

// Zod schema for query parameters
const blogPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  category: z.string().max(100).optional(),
  tag: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
});

// GET /api/blog/posts - Get published blog posts with pagination and filtering
export const GET = withApi({
  auth: "none",
  querySchema: blogPostsQuerySchema,
}, async ({ query }) => {
  const enableMockFallback = process.env.NEXT_PUBLIC_USE_BLOG_MOCK_FALLBACK === "false" ? false : true;
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    return {
      posts: MOCK_POSTS,
      pagination: {
        page: 1,
        limit: MOCK_POSTS.length,
        total: MOCK_POSTS.length,
        pages: 1,
      },
      message: "Blog posts retrieved successfully (mock)",
    };
  }

  let db;
  try {
    db = getAdminDb();
  } catch (initError) {
    console.error("Failed to initialize Firestore admin instance:", initError);

    if (enableMockFallback) {
      console.warn("Falling back to mock blog posts response");
      return {
        posts: MOCK_POSTS,
        pagination: {
          page: 1,
          limit: MOCK_POSTS.length,
          total: MOCK_POSTS.length,
          pages: 1,
        },
        message: "Mock data fallback: Firestore unavailable",
      };
    }

    throw new Error("Blog service unavailable");
  }

  const { page, limit, category, tag, search } = query;

  // Start with published posts only
  let firestoreQuery = db.collection("blogPosts").where("status", "==", "published");

  if (category) {
    firestoreQuery = firestoreQuery.where("category", "==", category);
  }

  firestoreQuery = firestoreQuery.orderBy("createdAt", "desc");

  const snapshot = await firestoreQuery.get();

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

  return {
    posts: paginatedPosts,
    pagination: {
      page,
      limit,
      total: posts.length,
      pages: Math.ceil(posts.length / limit),
    },
  };
});
