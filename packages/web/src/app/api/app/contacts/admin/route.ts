import { NextRequest, NextResponse } from "next/server";
import {
  getAdminDb,
  verifyIdToken,
  isUserAdmin,
} from "../../../../../firebase/admin";
import type { ContactSubmission } from "../../../../../types/api";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

// GET /api/app/contacts/admin - Get all contact submissions (admin only)
export async function GET(request: NextRequest) {
  try {
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

    // Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query
    let query = db.collection('contacts').orderBy('createdAt', 'desc');

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    // Apply pagination
    query = query.limit(limit);
    if (offset > 0) {
      query = query.offset(offset);
    }

    const snapshot = await query.get();

    const contacts: ContactSubmission[] = [];
    snapshot.forEach((doc) => {
      contacts.push({
        _id: doc.id,
        ...doc.data(),
      } as ContactSubmission);
    });

    // Get total count for pagination
    const totalQuery = status && status !== 'all'
      ? db.collection('contacts').where('status', '==', status)
      : db.collection('contacts');

    const totalSnapshot = await totalQuery.count().get();
    const total = totalSnapshot.data().count;

    return NextResponse.json({
      contacts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: "Failed to fetch contact submissions"
    }, { status: 500 });
  }
}
