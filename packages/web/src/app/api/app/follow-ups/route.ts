import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { createFirestoreCollection } from "@/firebase/firestore";
import { applyCorsHeaders, preflightResponse } from "@/lib/api/cors";

// POST /api/app/follow-ups - Create a new follow-up
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return applyCorsHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        request,
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return applyCorsHeaders(
        NextResponse.json({ error: "Invalid token" }, { status: 401 }),
        request,
      );
    }

    const followUpData = await request.json();
    
    // Validate required fields
    const requiredFields = ['applicationId', 'userId', 'type', 'scheduledDate'];
    for (const field of requiredFields) {
      if (!followUpData[field]) {
        return applyCorsHeaders(
          NextResponse.json({ error: `${field} is required` }, { status: 400 }),
          request,
        );
      }
    }

    // Verify userId matches token
    if (followUpData.userId !== decodedToken.uid) {
      return applyCorsHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        request,
      );
    }

    // Initialize Firestore
    const followUpsCollection = createFirestoreCollection<any>('followUps');

    // Create follow-up object
    const followUpDataToCreate = {
      applicationId: followUpData.applicationId,
      userId: followUpData.userId,
      type: followUpData.type,
      scheduledDate: followUpData.scheduledDate,
      completed: followUpData.completed || false,
      notes: followUpData.notes || '',
    };

    // Create follow-up in Firestore
    const createdFollowUp = await followUpsCollection.create(followUpDataToCreate);

    return applyCorsHeaders(NextResponse.json(createdFollowUp._id), request);
  } catch (error) {
    console.error("Error creating follow-up:", error);
    return applyCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      request,
    );
  }
}

// GET /api/app/follow-ups - Get all follow-ups (admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return applyCorsHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        request,
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return applyCorsHeaders(
        NextResponse.json({ error: "Invalid token" }, { status: 401 }),
        request,
      );
    }

    // Initialize Firestore
    const followUpsCollection = createFirestoreCollection<any>('followUps');

    // Get all follow-ups (admin only)
    const followUps = await followUpsCollection.getAll();

    return applyCorsHeaders(NextResponse.json(followUps), request);
  } catch (error) {
    console.error("Error fetching follow-ups:", error);
    return applyCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      request,
    );
  }
}


// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request);
}
