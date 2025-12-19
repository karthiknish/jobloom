import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { withApi, OPTIONS, z } from "@/lib/api/withApi";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

const userParamsSchema = z.object({
  userId: z.string(),
});

// GET /api/app/jobs/user/[userId] - Get jobs for a specific user
export const GET = withApi({
  auth: "required",
  paramsSchema: userParamsSchema,
}, async ({ params, user }) => {
  const { userId } = params;

  // Verify userId matches token
  if (userId !== user!.uid) {
    throw new Error("Unauthorized: User ID mismatch");
  }

  // Use Admin SDK for server-side Firestore access
  const db = getAdminDb();
  const jobsRef = db.collection('jobs');
  const snapshot = await jobsRef.where('userId', '==', userId).get();

  const jobs = snapshot.docs.map(doc => ({
    _id: doc.id,
    id: doc.id,
    ...doc.data()
  }));

  return jobs;
});

