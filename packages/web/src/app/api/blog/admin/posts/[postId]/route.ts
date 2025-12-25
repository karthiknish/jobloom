import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { z } from "zod";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

const postIdParamsSchema = z.object({
  postId: z.string(),
});

const blogPostUpdateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  featuredImage: z.string().url().nullable().optional(),
});

// GET /api/blog/admin/posts/[postId] - Get a single blog post for admin
export const GET = withApi({
  auth: "admin",
  rateLimit: "blog-admin",
  paramsSchema: postIdParamsSchema,
}, async ({ params }) => {
  const { postId } = params;

  const postRef = db.collection("blogPosts").doc(postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) {
    throw new Error("Post not found");
  }

  const data = postDoc.data() || {};

  const createdAt = (data as any).createdAt?.toMillis?.() ?? (data as any).createdAt ?? null;
  const updatedAt = (data as any).updatedAt?.toMillis?.() ?? (data as any).updatedAt ?? null;
  const publishedAt = (data as any).publishedAt?.toMillis?.() ?? (data as any).publishedAt ?? null;

  return {
    post: {
      _id: postDoc.id,
      ...(data as any),
      createdAt,
      updatedAt,
      publishedAt,
    },
  };
});

// PUT /api/blog/admin/posts/[postId] - Update a blog post
export const PUT = withApi({
  auth: "admin",
  rateLimit: "blog-admin",
  paramsSchema: postIdParamsSchema,
  bodySchema: blogPostUpdateSchema,
}, async ({ params, body }) => {
  const { postId } = params;
  const { title, content, excerpt, category, tags, status, featuredImage } = body;

  // Check if post exists
  const postRef = db.collection("blogPosts").doc(postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) {
    throw new Error("Post not found");
  }

  // Generate new slug if title changed
  const currentData = postDoc.data();
  let slug = currentData?.slug;

  if (title !== currentData?.title) {
    slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if new slug already exists (excluding current post)
    const existingPost = await db
      .collection("blogPosts")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (!existingPost.empty && existingPost.docs[0].id !== postId) {
      throw new Error("A post with this title already exists");
    }
  }

  // Update the post
  const updateData: any = {
    title,
    content,
    excerpt,
    category,
    tags: tags || [],
    status: status || "draft",
    featuredImage: featuredImage || null,
    slug,
    updatedAt: Date.now(),
  };

  // Set publishedAt if status changed to published
  if (status === "published" && currentData?.status !== "published") {
    updateData.publishedAt = Date.now();
  }

  await postRef.update(updateData);

  return {
    message: "Blog post updated successfully"
  };
});

// DELETE /api/blog/admin/posts/[postId] - Delete a blog post
export const DELETE = withApi({
  auth: "admin",
  rateLimit: "blog-admin",
  paramsSchema: postIdParamsSchema,
}, async ({ params }) => {
  const { postId } = params;

  // Check if post exists
  const postRef = db.collection("blogPosts").doc(postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) {
    throw new Error("Post not found");
  }

  await postRef.delete();

  return {
    message: "Blog post deleted successfully"
  };
});
