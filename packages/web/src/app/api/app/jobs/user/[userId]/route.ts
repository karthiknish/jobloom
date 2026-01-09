import { getAdminDb } from "@/firebase/admin";
import { withApi, OPTIONS, z } from "@/lib/api/withApi";
import { AuthorizationError } from "@/lib/api/errorResponse";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

export const runtime = "nodejs";

const userParamsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

const querySchema = z.object({
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 100) : 50),
  cursor: z.string().optional(),
});

// GET /api/app/jobs/user/[userId] - Get jobs for a specific user
export const GET = withApi({
  auth: "required",
  paramsSchema: userParamsSchema,
  querySchema: querySchema,
}, async ({ params, user, query }) => {
  const { userId } = params;
  const { limit, cursor } = query;

  // Verify userId matches token
  if (userId !== user!.uid && !user!.isAdmin) {
    throw new AuthorizationError(
      "Unauthorized: User ID mismatch",
      "FORBIDDEN"
    );
  }

  // Use Admin SDK for server-side Firestore access
  const db = getAdminDb();
  let jobsQuery = db.collection('jobs')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (cursor) {
    const cursorValue = /^\d+$/.test(cursor) ? parseInt(cursor, 10) : cursor;
    jobsQuery = jobsQuery.startAfter(cursorValue);
  }

  const snapshot = await jobsQuery.get();

  const jobs = snapshot.docs.map(doc => ({
    _id: doc.id,
    id: doc.id,
    ...doc.data()
  }));

  const lastDoc = snapshot.docs[snapshot.docs.length - 1];
  const nextCursor = lastDoc ? (lastDoc.data().createdAt?.toMillis?.() || lastDoc.data().createdAt) : null;

  return {
    jobs,
    count: jobs.length,
    nextCursor,
    message: 'Jobs retrieved successfully',
  };
});

