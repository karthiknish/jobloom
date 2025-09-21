import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, isUserAdmin } from "@/firebase/admin";
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

// GET /api/blog/admin/posts - Get all blog posts for admin (including drafts)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(decodedToken.uid);
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status"); // draft, published, archived

    let query = db.collection("blogPosts");

    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();

    const posts = snapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching admin blog posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/blog/admin/posts - Create a new blog post
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(decodedToken.uid);
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      category,
      tags,
      status,
      featuredImage,
    } = body;

    if (!title || !content || !excerpt || !category) {
      return NextResponse.json(
        { error: "Missing required fields: title, content, excerpt, category" },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: "A post with this title already exists" },
        { status: 400 }
      );
    }

    // Calculate reading time (roughly 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Get author info
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.data();

    const postData = {
      title,
      slug,
      content,
      excerpt,
      author: {
        id: decodedToken.uid,
        name: userData?.name || userData?.email || "Admin",
        email: userData?.email || "",
      },
      status: status || "draft",
      publishedAt: status === "published" ? admin.firestore.FieldValue.serverTimestamp() : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      tags: tags || [],
      category,
      featuredImage,
      readingTime,
      viewCount: 0,
      likeCount: 0,
    };

    const docRef = await db.collection("blogPosts").add(postData);

    return NextResponse.json({
      success: true,
      postId: docRef.id,
      slug,
    });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
