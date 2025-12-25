import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, Query, CollectionReference } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { z } from "zod";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

const blogAdminQuerySchema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
});

const blogPostCreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  featuredImage: z.string().url().nullable().optional(),
});

// GET /api/blog/admin/posts - Get all blog posts for admin (including drafts)
export const GET = withApi({
  auth: "admin",
  rateLimit: "blog-admin",
  querySchema: blogAdminQuerySchema,
}, async ({ query }) => {
  const { status } = query;

  let firestoreQuery: Query | CollectionReference = db.collection("blogPosts");

  if (status) {
    firestoreQuery = firestoreQuery.where("status", "==", status);
  }

  const snapshot = await firestoreQuery.orderBy("createdAt", "desc").get();

  const posts = snapshot.docs.map((doc) => {
    const data = doc.data();
    const createdAt = data.createdAt?.toMillis?.() ?? data.createdAt ?? null;
    const updatedAt = data.updatedAt?.toMillis?.() ?? data.updatedAt ?? null;
    const publishedAt = data.publishedAt?.toMillis?.() ?? data.publishedAt ?? null;

    return {
      _id: doc.id,
      ...data,
      createdAt,
      updatedAt,
      publishedAt,
    };
  });

  return {
    posts,
    count: posts.length,
    message: 'Blog posts retrieved successfully'
  };
});

// POST /api/blog/admin/posts - Create a new blog post
export const POST = withApi({
  auth: "admin",
  rateLimit: "blog-admin",
  bodySchema: blogPostCreateSchema,
}, async ({ body, user }) => {
  const {
    title,
    content,
    excerpt,
    category,
    tags,
    status,
    featuredImage,
  } = body;

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Check if slug already exists
  const existingPost = await db
    .collection("blogPosts")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (!existingPost.empty) {
    throw new Error("A post with this title already exists");
  }

  // Create the post
  const postRef = await db.collection("blogPosts").add({
    title,
    slug,
    content,
    excerpt,
    category,
    tags: tags || [],
    status: status || "draft",
    featuredImage: featuredImage || null,
    author: {
      id: user!.uid,
      name: user!.name || "Admin",
      email: user!.email || "",
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    publishedAt: status === "published" ? Date.now() : null,
    viewCount: 0,
    likeCount: 0,
  });

  return {
    _id: postRef.id,
    message: "Blog post created successfully"
  };
});
