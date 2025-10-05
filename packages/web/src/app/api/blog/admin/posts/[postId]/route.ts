import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, isUserAdmin, getAdminDb, FieldPath, FieldValue } from "@/firebase/admin";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

// PUT /api/blog/admin/posts/[postId] - Update a blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

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
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
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

      // Check if new slug conflicts with another post
      const existingPost = await db
        .collection("blogPosts")
        .where("slug", "==", slug)
        .where(FieldPath.documentId(), "!=", postId)
        .limit(1)
        .get();

      if (!existingPost.empty) {
        return NextResponse.json(
          { error: "A post with this title already exists" },
          { status: 400 }
        );
      }
    }

    // Calculate reading time
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const updateData: any = {
      title,
      slug,
      content,
      excerpt,
      category,
      tags: tags || [],
      featuredImage,
      readingTime,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Handle status changes
    if (status !== currentData?.status) {
      updateData.status = status;
      if (status === "published" && !currentData?.publishedAt) {
        updateData.publishedAt = FieldValue.serverTimestamp();
      }
    }

    await postRef.update(updateData);

    return NextResponse.json({
      success: true,
      slug,
    });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/admin/posts/[postId] - Delete a blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

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

    // Check if post exists
    const postRef = db.collection("blogPosts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await postRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
