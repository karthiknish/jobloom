import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "../../../../../firebase/admin";
import { FieldValue } from "@/firebase/admin";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

// GET /api/blog/posts/[slug] - Get a single blog post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const postsRef = db.collection("blogPosts");
    const snapshot = await postsRef
      .where("slug", "==", slug)
      .where("status", "==", "published")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
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

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/blog/posts/[slug]/like - Like a blog post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const postsRef = db.collection("blogPosts");
    const snapshot = await postsRef.where("slug", "==", slug).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const doc = snapshot.docs[0];

    // Increment like count
    await doc.ref.update({
      likeCount: FieldValue.increment(1),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error liking blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
