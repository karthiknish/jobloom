import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, verifyIdToken } from "@/firebase/admin";
import { applyCorsHeaders, preflightResponse } from "@/lib/api/cors";

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return applyCorsHeaders(
        NextResponse.json(
          { error: "Authorization token required" },
          { status: 401 }
        ),
        request,
      );
    }

    const token = authHeader.split(" ")[1];

    // In development with mock tokens, skip Firebase operations for testing
    const isMockToken = process.env.NODE_ENV === "development" &&
      request.headers.get("authorization")?.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    if (isMockToken) {
      // Return mock UK sponsorship criteria for testing
      return applyCorsHeaders(
        NextResponse.json({
          minimumSalary: 45000,
          isUnder26: false,
          isRecentGraduate: false,
          hasPhD: false,
          isSTEMPhD: false,
          message: 'UK sponsorship criteria retrieved successfully (mock)'
        }),
        request,
      );
    }

    // Verify the token
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return applyCorsHeaders(
        NextResponse.json(
          { error: "Invalid authentication token" },
          { status: 401 }
        ),
        request,
      );
    }

    const uid = decodedToken.uid;

    if (!uid) {
      return applyCorsHeaders(
        NextResponse.json(
          { error: "User ID not found in token" },
          { status: 400 }
        ),
        request,
      );
    }

    // Get user preferences from Firestore
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    // Extract preferences
    const preferences = userData?.preferences || {};

    // Transform preferences into UK sponsorship criteria
    const criteria = {
      minimumSalary: preferences.minimumSalary || 38700, // UK default minimum
      isUnder26: preferences.ageCategory === 'student' || preferences.ageCategory === 'youngAdult',
      isRecentGraduate: preferences.educationStatus === 'bachelor' ||
                       preferences.educationStatus === 'master' ||
                       preferences.professionalStatus === 'entry-level',
      hasPhD: preferences.phdStatus === 'completed',
      isSTEMPhD: preferences.phdField === 'stem' // This field might need to be added to settings
    };

    return applyCorsHeaders(
      NextResponse.json({
        ...criteria,
        message: 'UK sponsorship criteria retrieved successfully'
      }),
      request,
    );

  } catch (error) {
    console.error('Error fetching UK sponsorship criteria:', error);
    return applyCorsHeaders(
      NextResponse.json(
        { error: "Failed to fetch UK sponsorship criteria" },
        { status: 500 }
      ),
      request,
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request);
}