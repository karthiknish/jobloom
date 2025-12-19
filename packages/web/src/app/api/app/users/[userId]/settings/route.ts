import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { z } from "zod";

const settingsParamsSchema = z.object({
  userId: z.string(),
});

// PUT /api/app/users/[userId]/settings - Update user settings
export const PUT = withApi({
  auth: "required",
  paramsSchema: settingsParamsSchema,
  bodySchema: z.record(z.string(), z.any()),
  handler: async ({ params, body, user }) => {
    const { userId } = params;

    if (user!.uid !== userId) {
      return NextResponse.json(
        { error: "Access denied. You can only update your own settings." },
        { status: 403 }
      );
    }

    // Initialize Firestore
    const db = getAdminDb();
    const userDocRef = db.collection("users").doc(userId);

    // Update user settings in Firestore
    await userDocRef.update({
      settings: body,
      updatedAt: new Date().toISOString()
    });

    return {
      message: 'Settings updated successfully',
      settings: body
    };
  }
});

// GET /api/app/users/[userId]/settings - Get user settings
export const GET = withApi({
  auth: "required",
  paramsSchema: settingsParamsSchema,
  handler: async ({ params, user }) => {
    const { userId } = params;

    if (user!.uid !== userId) {
      return NextResponse.json(
        { error: "Access denied. You can only access your own settings." },
        { status: 403 }
      );
    }

    // Initialize Firestore
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return { settings: {} };
    }

    const userData = userDoc.data();
    return { settings: userData?.settings || {} };
  }
});
