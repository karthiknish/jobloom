import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "../../../../../firebase/admin";
import { FieldValue } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { z } from "zod";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

const slugParamsSchema = z.object({
  slug: z.string(),
});

// GET /api/blog/posts/[slug] - Get a single blog post by slug
export const GET = withApi({
  auth: "none",
  paramsSchema: slugParamsSchema,
}, async ({ params }) => {
  const { slug } = params;

  const postsRef = db.collection("blogPosts");
  const snapshot = await postsRef
    .where("slug", "==", slug)
    .where("status", "==", "published")
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error("Post not found");
  }

  const doc = snapshot.docs[0];
  const data = doc.data();
  const post = {
    _id: doc.id,
    ...data,
    // Convert Firestore timestamps to milliseconds for frontend compatibility
    createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
    updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now(),
    publishedAt: data.publishedAt?.toMillis?.() || data.publishedAt,
  };

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

  const postsRef = db.collection("blogPosts");
  const snapshot = await postsRef.where("slug", "==", slug).limit(1).get();

  if (snapshot.empty) {
    throw new Error("Post not found");
  }

  const doc = snapshot.docs[0];

  // Increment like count
  await doc.ref.update({
    likeCount: FieldValue.increment(1),
  });

  return { success: true };
});
