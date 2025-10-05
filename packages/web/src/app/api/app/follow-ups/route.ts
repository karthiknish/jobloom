import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { createFirestoreCollection } from "@/firebase/firestore";
import { getAdminFirestore } from "@/firebase/admin";

// POST /api/app/follow-ups - Create a new follow-up
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

    const followUpData = await request.json();
    
    // Validate required fields
    const requiredFields = ['applicationId', 'userId', 'type', 'scheduledDate'];
    for (const field of requiredFields) {
      if (!followUpData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Verify userId matches token
    if (followUpData.userId !== decodedToken.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json(createdFollowUp._id);
  } catch (error) {
    console.error("Error creating follow-up:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/app/follow-ups - Get all follow-ups (admin only)
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

    // Initialize Firestore
    const followUpsCollection = createFirestoreCollection<any>('followUps');

    // Get all follow-ups (admin only)
    const followUps = await followUpsCollection.getAll();

    return NextResponse.json(followUps);
  } catch (error) {
    console.error("Error fetching follow-ups:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}