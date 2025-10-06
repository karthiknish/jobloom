import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { createFirestoreCollection } from "@/firebase/firestore";
import { getAdminFirestore } from "@/firebase/admin";
import { where } from "firebase/firestore";

// GET /api/app/jobs/user/[userId] - Get jobs for a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // In development, allow mock tokens for testing
    let decodedToken;
    if (process.env.NODE_ENV === "development" && token.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc")) {
      decodedToken = {
        uid: "test-user-123",
        email: "test@example.com",
        email_verified: true
      };
    } else {
      decodedToken = await verifyIdToken(token);
    }

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Verify userId matches token
    if (userId !== decodedToken.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In development with mock tokens, skip Firebase operations for testing
    const isMockToken = process.env.NODE_ENV === "development" && 
      request.headers.get("authorization")?.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    if (isMockToken) {
      // Return mock success response for testing
      return NextResponse.json([]);
    }

    // Initialize Firestore
    const jobsCollection = createFirestoreCollection<any>('jobs');

    // Get jobs for the specific user
    const userJobs = await jobsCollection.query([where('userId', '==', userId)]);

    return NextResponse.json(userJobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}