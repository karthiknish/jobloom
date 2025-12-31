import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { z } from "zod";
import { NotFoundError } from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";

const userParamsSchema = z.object({
  userId: z.string(),
});

// GET /api/app/users/[userId] - Get user by ID
export const GET = withApi({
  auth: 'admin',
  paramsSchema: userParamsSchema,
}, async ({ params }) => {
  const { userId } = params;

  // Fetch user from Firestore
  const db = getAdminDb();
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    throw new NotFoundError(
      "User not found",
      "user",
      ERROR_CODES.USER_NOT_FOUND
    );
  }

  const userData = userDoc.data();
  if (!userData) {
    throw new NotFoundError(
      "User data not found",
      "user",
      ERROR_CODES.USER_NOT_FOUND
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

  return {
    user,
    message: 'User retrieved successfully'
  };
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  emailVerified: z.boolean().optional(),
  subscriptionStatus: z.string().nullable().optional(),
  provider: z.string().nullable().optional(),
  // Explicitly NOT including isAdmin, email, or subscriptionPlan
  // to prevent mass assignment vulnerabilities.
});

// PUT /api/app/users/[userId] - Update user
export const PUT = withApi({
  auth: 'admin',
  paramsSchema: userParamsSchema,
  bodySchema: updateUserSchema,
}, async ({ params, body }) => {
  const { userId } = params;
  const db = getAdminDb();
  
  await db.collection("users").doc(userId).update({
    ...body,
    updatedAt: Date.now()
  });

  return { message: 'User updated successfully' };
});

// DELETE /api/app/users/[userId] - Delete user
export const DELETE = withApi({
  auth: 'admin',
  paramsSchema: userParamsSchema,
}, async ({ params }) => {
  const { userId } = params;
  const db = getAdminDb();
  await db.collection("users").doc(userId).delete();

  return { message: 'User deleted successfully' };
});

export { OPTIONS } from "@/lib/api/withApi";
