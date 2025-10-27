import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, Query, CollectionReference, FieldValue } from "@/firebase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { withErrorHandling, generateRequestId } from "@/lib/api/errors";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

// GET /api/blog/admin/posts - Get all blog posts for admin (including drafts)
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    const auth = await authenticateRequest(request, {
      requireAdmin: true,
      requireAuthHeader: true,
      loadUser: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status"); // draft, published, archived

    let query: Query | CollectionReference = db.collection("blogPosts");

    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();

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

    return NextResponse.json({
      posts,
      count: posts.length,
      message: 'Blog posts retrieved successfully'
    });
  }, {
    endpoint: '/api/blog/admin/posts',
    method: 'GET',
    requestId
  });
}

// POST /api/blog/admin/posts - Create a new blog post
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    const auth = await authenticateRequest(request, {
      requireAdmin: true,
      requireAuthHeader: true,
      loadUser: true,
    });

    if (!auth.ok) {
      return auth.response;
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
        { status: 409 }
      );
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
        id: auth.token.uid,
        name: auth.token.name || "Admin",
        email: auth.token.email || "",
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      publishedAt: status === "published" ? Date.now() : null,
      viewCount: 0,
      likeCount: 0,
    });

    return NextResponse.json({
      _id: postRef.id,
      message: "Blog post created successfully"
    });
  }, {
    endpoint: '/api/blog/admin/posts',
    method: 'POST',
    requestId
  });
}
