import { NextRequest, NextResponse } from "next/server";
import {
  getAdminDb,
  verifyIdToken,
  isUserAdmin,
} from "../../../../../../firebase/admin";
import type { ContactSubmission } from "../../../../../../types/api";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

// GET /api/app/contacts/admin/[contactId] - Get a specific contact submission (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const { contactId } = await params;

    // Verify admin authentication
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

    // Fetch contact submission
    const docRef = db.collection('contacts').doc(contactId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Contact submission not found" }, { status: 404 });
    }

    const contact: ContactSubmission = {
      _id: docSnap.id,
      ...docSnap.data(),
    } as ContactSubmission;

    return NextResponse.json({ contact });
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: "Failed to fetch contact submission"
    }, { status: 500 });
  }
}

// PUT /api/app/contacts/admin/[contactId] - Update a contact submission (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const { contactId } = await params;
    const updateData = await request.json();

    // Verify admin authentication
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

    // Validate update data
    const allowedUpdates = ['status', 'response'];
    const updates: Partial<ContactSubmission> = {};

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedUpdates.includes(key)) {
        if (key === 'status' && typeof value === 'string') {
          updates.status = value as ContactSubmission['status'];
        } else if (key === 'response' && typeof value === 'string') {
          updates.response = value;
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    // Add metadata for updates
    updates.updatedAt = Date.now();

    if (updates.status === 'responded' && updates.response) {
      updates.respondedAt = Date.now();
      updates.respondedBy = decodedToken.uid;
    }

    // Update contact submission
    const docRef = db.collection('contacts').doc(contactId);
    await docRef.update(updates);

    return NextResponse.json({
      success: true,
      message: "Contact submission updated successfully"
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: "Failed to update contact submission"
    }, { status: 500 });
  }
}

// DELETE /api/app/contacts/admin/[contactId] - Delete a contact submission (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const { contactId } = await params;

    // Verify admin authentication
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

    // Delete contact submission
    const docRef = db.collection('contacts').doc(contactId);
    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Contact submission deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: "Failed to delete contact submission"
    }, { status: 500 });
  }
}
