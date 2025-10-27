import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { withErrorHandling, generateRequestId } from "@/lib/api/errors";

// GET /api/app/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    const auth = await authenticateRequest(request, {
      requireAdmin: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    // Fetch all users from Firestore
    const db = getAdminDb();
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
