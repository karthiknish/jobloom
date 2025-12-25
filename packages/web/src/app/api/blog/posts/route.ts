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
    title: "Optimizing Your Job Search Strategy",
    slug: "optimizing-job-search-strategy",
    excerpt: "Learn how to streamline your job search and find the right opportunities faster.",
    content: "Searching for a job can be a full-time job itself. Here is how to optimize your workflow...",
    category: "Career Advice",
    tags: ["job search", "career", "productivity"],
    status: "published",
    author: MOCK_AUTHOR,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    publishedAt: Date.now(),
    featuredImage: "https://example.com/job-search.jpg",
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

const toMillis = (value: unknown): number => {
  if (!value) return Date.now();
  if (typeof value === "number") return Number.isFinite(value) ? value : Date.now();
  if (typeof value === "string") {
    const n = /^\d+$/.test(value) ? Number(value) : new Date(value).getTime();
    return Number.isFinite(n) ? n : Date.now();
  }
  if (value instanceof Date) {
    const n = value.getTime();
    return Number.isFinite(n) ? n : Date.now();
  }
  if (typeof value === "object") {
    const anyVal = value as any;
    if (typeof anyVal.toMillis === "function") {
      const n = anyVal.toMillis();
      return typeof n === "number" && Number.isFinite(n) ? n : Date.now();
    }
    if (typeof anyVal.toDate === "function") {
      const d = anyVal.toDate();
      const n = d instanceof Date ? d.getTime() : NaN;
      return Number.isFinite(n) ? n : Date.now();
    }
    if (typeof anyVal.seconds === "number") {
      const nanos = typeof anyVal.nanoseconds === "number" ? anyVal.nanoseconds : 0;
      const n = anyVal.seconds * 1000 + Math.floor(nanos / 1_000_000);
      return Number.isFinite(n) ? n : Date.now();
    }
    if (typeof anyVal._seconds === "number") {
      const nanos = typeof anyVal._nanoseconds === "number" ? anyVal._nanoseconds : 0;
      const n = anyVal._seconds * 1000 + Math.floor(nanos / 1_000_000);
      return Number.isFinite(n) ? n : Date.now();
    }
  }
  return Date.now();
};

const normalizeAuthor = (value: unknown) => {
  if (value && typeof value === "object") {
    const anyVal = value as any;
    const name = typeof anyVal.name === "string" && anyVal.name.trim() ? anyVal.name : "HireAll Team";
    const email = typeof anyVal.email === "string" ? anyVal.email : "";
    const id = typeof anyVal.id === "string" ? anyVal.id : "";
    return { id, name, email };
  }
  if (typeof value === "string" && value.trim()) {
    return { id: "", name: value, email: "" };
  }
  return { id: "", name: "HireAll Team", email: "" };
};

const normalizePost = (docId: string, data: Record<string, any>) => {
  const title = typeof data.title === "string" ? data.title : "Untitled";
  const slug = typeof data.slug === "string" ? data.slug : "";
  const excerpt = typeof data.excerpt === "string" ? data.excerpt : "";
  const content = typeof data.content === "string" ? data.content : "";
  const category = typeof data.category === "string" ? data.category : "General";
  const tags = Array.isArray(data.tags) ? data.tags.filter((t: any) => typeof t === "string") : [];

  return {
    _id: docId,
    ...data,
    title,
    slug,
    excerpt,
    content,
    category,
    tags,
    author: normalizeAuthor(data.author),
    status: data.status || "published",
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
    publishedAt: data.publishedAt ? toMillis(data.publishedAt) : undefined,
    viewCount: typeof data.viewCount === "number" ? data.viewCount : 0,
    likeCount: typeof data.likeCount === "number" ? data.likeCount : 0,
  };
};

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
  const forceMock = process.env.NEXT_PUBLIC_USE_BLOG_MOCK_FALLBACK === "true";

  if (forceMock) {
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
  let firestoreQuery: any = db.collection("blogPosts").where("status", "==", "published");

  if (category) {
    firestoreQuery = firestoreQuery.where("category", "==", category);
  }

  // Prefer ordering in Firestore, but fall back if the query errors (e.g. missing index)
  let snapshot;
  try {
    snapshot = await firestoreQuery.orderBy("createdAt", "desc").get();
  } catch (e) {
    snapshot = await firestoreQuery.get();
  }

  let posts = snapshot.docs.map((doc: any) => {
    const data = doc.data() as Record<string, any>;
    return normalizePost(doc.id, data);
  });

  // Ensure deterministic sort even if Firestore ordering was skipped
  posts.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

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
