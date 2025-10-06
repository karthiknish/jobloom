import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, verifyIdToken } from "@/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    // In development with mock tokens, skip Firebase operations for testing
    const isMockToken = process.env.NODE_ENV === "development" &&
      request.headers.get("authorization")?.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    if (isMockToken) {
      // Return mock UK sponsorship criteria for testing
      return NextResponse.json({
        minimumSalary: 45000,
        isUnder26: false,
        isRecentGraduate: false,
        hasPhD: false,
        isSTEMPhD: false,
        message: 'UK sponsorship criteria retrieved successfully (mock)'
      });
    }

    // Verify the token
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const uid = decodedToken.uid;

    if (!uid) {
      return NextResponse.json(
        { error: "User ID not found in token" },
        { status: 400 }
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

    return NextResponse.json({
      ...criteria,
      message: 'UK sponsorship criteria retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching UK sponsorship criteria:', error);
    return NextResponse.json(
      { error: "Failed to fetch UK sponsorship criteria" },
      { status: 500 }
    );
  }
}