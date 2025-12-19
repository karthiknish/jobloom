import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/firebase/admin";
import { withApi, OPTIONS, z } from "@/lib/api/withApi";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

const userParamsSchema = z.object({
  userId: z.string(),
});

// GET /api/app/admin/is-admin/[userId] - Check if user is admin
export const GET = withApi({
  auth: "required",
  paramsSchema: userParamsSchema,
}, async ({ params, user }) => {
  const { userId } = params;

  // Users can only check their own admin status
  if (user!.uid !== userId) {
    throw new Error("Forbidden: You can only check your own admin status");
  }

  // Check if user is admin from Firestore
  const isAdmin = await isUserAdmin(userId);

  return isAdmin;
});
