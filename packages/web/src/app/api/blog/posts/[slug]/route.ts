import { getAdminDb, FieldValue } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { z } from "zod";
import { NotFoundError, ServiceUnavailableError } from "@/lib/api/errorResponse";

export const runtime = "nodejs";

const slugParamsSchema = z.object({
  slug: z.string(),
});

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
    featuredImage: null,
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
    featuredImage: null,
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

// GET /api/blog/posts/[slug] - Get a single blog post by slug
export const GET = withApi({
  auth: "none",
  paramsSchema: slugParamsSchema,
}, async ({ params }) => {
  const { slug } = params;

  const enableMockFallback = process.env.NEXT_PUBLIC_USE_BLOG_MOCK_FALLBACK === "false" ? false : true;
  const forceMock = process.env.NEXT_PUBLIC_USE_BLOG_MOCK_FALLBACK === "true";
  if (forceMock) {
    const mock = MOCK_POSTS.find((p) => p.slug === slug);
    if (!mock) {
      throw new NotFoundError("Post not found", "blog-post");
    }
    return mock;
  }

  let db;
  try {
    db = getAdminDb();
  } catch (e) {
    if (enableMockFallback) {
      const mock = MOCK_POSTS.find((p) => p.slug === slug);
      if (!mock) {
        throw new NotFoundError("Post not found", "blog-post");
      }
      return mock;
    }
    throw new ServiceUnavailableError("Blog service unavailable", "firestore");
  }

  const postsRef = db.collection("blogPosts");
  const snapshot = await postsRef
    .where("slug", "==", slug)
    .where("status", "==", "published")
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new NotFoundError("Post not found", "blog-post");
  }

  const doc = snapshot.docs[0];
  const data = doc.data() as Record<string, any>;
  const post = normalizePost(doc.id, data);

  // Increment view count (fire and forget)
  doc.ref
    .update({
      viewCount: FieldValue.increment(1),
    })
    .catch(console.error);

  return post;
});

// POST /api/blog/posts/[slug]/like - Like a blog post
export const POST = withApi({
  auth: "none",
  paramsSchema: slugParamsSchema,
}, async ({ params }) => {
  const { slug } = params;

  const forceMock = process.env.NEXT_PUBLIC_USE_BLOG_MOCK_FALLBACK === "true";
  if (forceMock) {
    return { success: true };
  }

  let db;
  try {
    db = getAdminDb();
  } catch (e) {
    throw new ServiceUnavailableError("Blog service unavailable", "firestore");
  }

  const postsRef = db.collection("blogPosts");
  const snapshot = await postsRef.where("slug", "==", slug).limit(1).get();

  if (snapshot.empty) {
    throw new NotFoundError("Post not found", "blog-post");
  }

  const doc = snapshot.docs[0];

  // Increment like count
  await doc.ref.update({
    likeCount: FieldValue.increment(1),
  });

  return { success: true };
});
