import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { createFirestoreCollection } from "@/firebase/firestore";
import { where } from "firebase/firestore";
import { applyCorsHeaders, preflightResponse } from "@/lib/api/cors";

// GET /api/app/jobs/user/[userId] - Get jobs for a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return applyCorsHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        request,
      );
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
      return applyCorsHeaders(
        NextResponse.json({ error: "Invalid token" }, { status: 401 }),
        request,
      );
    }

    // Verify userId matches token
    if (userId !== decodedToken.uid) {
      return applyCorsHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        request,
      );
    }

    // In development with mock tokens, skip Firebase operations for testing
    const isMockToken = process.env.NODE_ENV === "development" && 
      request.headers.get("authorization")?.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    if (isMockToken) {
      // Return mock success response for testing
      return applyCorsHeaders(NextResponse.json([]), request);
    }

    // Initialize Firestore
    const jobsCollection = createFirestoreCollection<any>('jobs');

    // Get jobs for the specific user
    const userJobs = await jobsCollection.query([where('userId', '==', userId)]);

    return applyCorsHeaders(NextResponse.json(userJobs), request);
  } catch (error) {
    console.error("Error fetching jobs:", error);
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
