import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { createFirestoreCollection } from "@/firebase/firestore";
import { getFirestore } from "firebase-admin/firestore";

// POST /api/app/applications - Create a new application
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

    const applicationData = await request.json();
    
    // Validate required fields
    const requiredFields = ['jobId', 'userId', 'status'];
    for (const field of requiredFields) {
      if (!applicationData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Verify userId matches token
    if (applicationData.userId !== decodedToken.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize Firestore
    const applicationsCollection = createFirestoreCollection<any>('applications');

    // Create application object
    const applicationDataToCreate = {
      jobId: applicationData.jobId,
      userId: applicationData.userId,
      status: applicationData.status,
      appliedDate: applicationData.appliedDate || null,
      interviewDate: applicationData.interviewDate || null,
      notes: applicationData.notes || '',
      followUps: applicationData.followUps || [],
    };

    // Create application in Firestore
    const createdApplication = await applicationsCollection.create(applicationDataToCreate);

    return NextResponse.json(createdApplication._id);
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/app/applications - Get all applications (admin only)
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
    const applicationsCollection = createFirestoreCollection<any>('applications');

    // Get all applications (admin only)
    const applications = await applicationsCollection.getAll();

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}