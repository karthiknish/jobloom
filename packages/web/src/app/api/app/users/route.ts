import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb } from "@/firebase/admin";
import {
  withErrorHandling,
  validateAuthHeader,
  createAuthorizationError,
  generateRequestId
} from "@/lib/api/errors";

// GET /api/app/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    // Validate authorization
    const token = validateAuthHeader(request);
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      throw createAuthorizationError("Invalid authentication token", 'INVALID_TOKEN');
    }

    // Check admin permissions
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      throw createAuthorizationError("Admin access required", 'INSUFFICIENT_PERMISSIONS');
    }

    // Fetch all users from Firestore
    const usersSnapshot = await db.collection("users").get();
    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        _id: doc.id,
        email: data.email || "",
        name: data.name || "",
        isAdmin: data.isAdmin || false,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt,
        lastLoginAt: data.lastLoginAt,
        emailVerified: data.emailVerified || false
      };
    });

    return NextResponse.json({
      users,
      count: users.length,
      message: 'Users retrieved successfully'
    });
  }, {
    endpoint: '/api/app/users',
    method: 'GET',
    requestId
  });
}
