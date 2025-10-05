import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";
import {
  withErrorHandling,
  createAuthorizationError,
  generateRequestId
} from "@/lib/api/errors";

// GET /api/app/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    // Validate authorization
    const decodedToken = await verifySessionFromRequest(request);
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
    const toMillis = (value: unknown): number | undefined => {
      if (typeof value === "number") {
        return value;
      }
      if (value instanceof Date) {
        return value.getTime();
      }
      if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
        try {
          return (value as { toMillis: () => number }).toMillis();
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = toMillis(data.createdAt) ?? Date.now();
      const updatedAt = toMillis(data.updatedAt);
      const lastLoginAt = toMillis(data.lastLoginAt);
      return {
        _id: doc.id,
        email: data.email || "",
        name: data.name || "",
        isAdmin: data.isAdmin || false,
        createdAt,
        updatedAt,
        lastLoginAt,
        emailVerified: data.emailVerified || false,
        subscriptionPlan: data.subscriptionPlan || undefined,
        subscriptionStatus: data.subscriptionStatus || null,
        provider: data.provider || null
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
