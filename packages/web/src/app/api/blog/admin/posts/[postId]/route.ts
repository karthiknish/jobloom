import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, FieldPath, FieldValue } from "@/firebase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { withErrorHandling, generateRequestId } from "@/lib/api/errors";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

// PUT /api/blog/admin/posts/[postId] - Update a blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    const { postId } = await params;
    const auth = await authenticateRequest(request, {
      requireAdmin: true,
      requireAuthHeader: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const { title, content, excerpt, category, tags, status, featuredImage } =
      body;

    if (!title || !content || !excerpt || !category) {
      return NextResponse.json(
        { error: "Missing required fields: title, content, excerpt, category" },
        { status: 400 }
      );
    }

    // Check if post exists
    const postRef = db.collection("blogPosts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
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
        return NextResponse.json(
          { error: "A post with this title already exists" },
          { status: 409 }
        );
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

    return NextResponse.json({
      message: "Blog post updated successfully"
    });
  }, {
    endpoint: '/api/blog/admin/posts/[postId]',
    method: 'PUT',
    requestId
  });
}

// DELETE /api/blog/admin/posts/[postId] - Delete a blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    const { postId } = await params;
    const auth = await authenticateRequest(request, {
      requireAdmin: true,
      requireAuthHeader: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    // Check if post exists
    const postRef = db.collection("blogPosts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await postRef.delete();

    return NextResponse.json({
      message: "Blog post deleted successfully"
    });
  }, {
    endpoint: '/api/blog/admin/posts/[postId]',
    method: 'DELETE',
    requestId
  });
}
