import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { withErrorHandling, generateRequestId } from "@/lib/api/errors";

// GET /api/app/users/[userId] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    const { userId } = await params;
    
    const auth = await authenticateRequest(request, {
      requireAdmin: true,
      loadUser: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    // Fetch user from Firestore
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    if (!userData) {
      return NextResponse.json(
        { error: "User data not found" },
        { status: 404 }
      );
    }

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

    const user = {
      _id: userDoc.id,
      email: userData.email || "",
      name: userData.name || "",
      isAdmin: userData.isAdmin || false,
      createdAt: toMillis(userData.createdAt) ?? Date.now(),
      updatedAt: toMillis(userData.updatedAt),
      lastLoginAt: toMillis(userData.lastLoginAt),
      emailVerified: userData.emailVerified || false,
      subscriptionPlan: userData.subscriptionPlan || undefined,
      subscriptionStatus: userData.subscriptionStatus || null,
      provider: userData.provider || null
    };

    return NextResponse.json({
      user,
      message: 'User retrieved successfully'
    });
  }, {
    endpoint: '/api/app/users/[userId]',
    method: 'GET',
    requestId
  });
}

// PUT /api/app/users/[userId] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    const { userId } = await params;
    
    const auth = await authenticateRequest(request, {
      requireAdmin: true,
      loadUser: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const updates = await request.json();
    const db = getAdminDb();
    
    await db.collection("users").doc(userId).update({
      ...updates,
      updatedAt: Date.now()
    });

    return NextResponse.json({
      message: 'User updated successfully'
    });
  }, {
    endpoint: '/api/app/users/[userId]',
    method: 'PUT',
    requestId
  });
}

// DELETE /api/app/users/[userId] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    const { userId } = await params;
    
    const auth = await authenticateRequest(request, {
      requireAdmin: true,
      loadUser: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const db = getAdminDb();
    await db.collection("users").doc(userId).delete();

    return NextResponse.json({
      message: 'User deleted successfully'
    });
  }, {
    endpoint: '/api/app/users/[userId]',
    method: 'DELETE',
    requestId
  });
}