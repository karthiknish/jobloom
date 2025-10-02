import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
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

    // TODO: Add admin check
    // if (!decodedToken.admin) {
    //   throw createAuthorizationError("Admin access required", 'INSUFFICIENT_PERMISSIONS');
    // }

    // For now, return mock users data
    // In a real implementation, this would fetch from Firestore
    const users = [
      {
        _id: decodedToken.uid,
        email: decodedToken.email || "user@example.com",
        name: decodedToken.name || "User",
        isAdmin: false,
        createdAt: Date.now()
      }
    ];

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