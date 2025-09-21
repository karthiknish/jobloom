import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

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
    const post = {
      _id: doc.id,
      ...doc.data(),
    };

    // Increment view count (fire and forget)
    doc.ref.update({
      viewCount: admin.firestore.FieldValue.increment(1),
    }).catch(console.error);

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    const snapshot = await postsRef
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const doc = snapshot.docs[0];

    // Increment like count
    await doc.ref.update({
      likeCount: admin.firestore.FieldValue.increment(1),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error liking blog post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
