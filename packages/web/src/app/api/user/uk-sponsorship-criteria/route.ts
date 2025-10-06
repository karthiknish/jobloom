import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, verifyIdToken } from "@/firebase/admin";

// CORS helper function
function addCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigins = [
    'https://www.linkedin.com',
    'https://linkedin.com',
    process.env.NEXT_PUBLIC_WEB_URL || 'https://hireall.app',
    'http://localhost:3000',
  ];

  const requestOrigin = origin;

  if (requestOrigin && (allowedOrigins.includes(requestOrigin) || 
      requestOrigin.includes('hireall.app') || 
      requestOrigin.includes('vercel.app') || 
      requestOrigin.includes('netlify.app'))) {
    response.headers.set('Access-Control-Allow-Origin', requestOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  } else if (process.env.NODE_ENV === 'development') {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  }

  return response;
}

export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');

    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const response = NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    const token = authHeader.split(" ")[1];

    // In development with mock tokens, skip Firebase operations for testing
    const isMockToken = process.env.NODE_ENV === "development" &&
      request.headers.get("authorization")?.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    if (isMockToken) {
      // Return mock UK sponsorship criteria for testing
      const response = NextResponse.json({
        minimumSalary: 45000,
        isUnder26: false,
        isRecentGraduate: false,
        hasPhD: false,
        isSTEMPhD: false,
        message: 'UK sponsorship criteria retrieved successfully (mock)'
      });
      return addCorsHeaders(response, origin || undefined);
    }

    // Verify the token
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      const response = NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    const uid = decodedToken.uid;

    if (!uid) {
      const response = NextResponse.json(
        { error: "User ID not found in token" },
        { status: 400 }
      );
      return addCorsHeaders(response, origin || undefined);
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

    const response = NextResponse.json({
      ...criteria,
      message: 'UK sponsorship criteria retrieved successfully'
    });
    return addCorsHeaders(response, origin || undefined);

  } catch (error) {
    console.error('Error fetching UK sponsorship criteria:', error);
    const response = NextResponse.json(
      { error: "Failed to fetch UK sponsorship criteria" },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get('origin') || undefined);
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin || undefined);
}