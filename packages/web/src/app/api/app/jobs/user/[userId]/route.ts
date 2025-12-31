import { getAdminDb } from "@/firebase/admin";
import { withApi, OPTIONS, z } from "@/lib/api/withApi";
import { AuthorizationError } from "@/lib/api/errorResponse";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

export const runtime = "nodejs";

const userParamsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

// GET /api/app/jobs/user/[userId] - Get jobs for a specific user
export const GET = withApi({
  auth: "required",
  paramsSchema: userParamsSchema,
}, async ({ params, user }) => {
  const { userId } = params;

  // Verify userId matches token
  if (userId !== user!.uid && !user!.isAdmin) {
    throw new AuthorizationError(
      "Unauthorized: User ID mismatch",
      "FORBIDDEN"
    );
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

  return {
    jobs,
    count: jobs.length,
    message: 'Jobs retrieved successfully',
  };
});

