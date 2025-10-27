import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { getAdminDb } from "@/firebase/admin";
import { applyCorsHeaders, preflightResponse } from "@/lib/api/cors";
import { withErrorHandling, createAuthorizationError, generateRequestId } from "@/lib/api/errors";

// PUT /api/app/users/[userId]/settings - Update user settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const requestId = generateRequestId();
  const { userId } = await params;

  const response = await withErrorHandling(async () => {
    // Validate authorization
    const auth = await authenticateRequest(request);

    if (!auth.ok) {
      return auth.response;
    }

    if (auth.token.uid !== userId) {
      throw createAuthorizationError("Access denied. You can only update your own settings.", 'INSUFFICIENT_PERMISSIONS');
    }

    // Parse request body
    const settingsData = await request.json();

    // Initialize Firestore
    const db = getAdminDb();
    const userDocRef = db.collection("users").doc(userId);

    // Update user settings in Firestore
    await userDocRef.update({
      settings: settingsData,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: settingsData
    });

  }, {
    endpoint: '/api/app/users/[userId]/settings',
    method: 'PUT',
    requestId,
    userId
  });

  return applyCorsHeaders(response, request);
}

// GET /api/app/users/[userId]/settings - Get user settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const requestId = generateRequestId();
  const { userId } = await params;

  const response = await withErrorHandling(async () => {
    // Validate authorization
    const auth = await authenticateRequest(request);

    if (!auth.ok) {
      return auth.response;
    }

    if (auth.token.uid !== userId) {
      throw createAuthorizationError("Access denied. You can only access your own settings.", 'INSUFFICIENT_PERMISSIONS');
    }

    // Initialize Firestore
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json({
        settings: {}
      });
    }

    const userData = userDoc.data();
    return NextResponse.json({
      settings: userData?.settings || {}
    });

  }, {
    endpoint: '/api/app/users/[userId]/settings',
    method: 'GET',
    requestId,
    userId
  });

  return applyCorsHeaders(response, request);
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request);
}
