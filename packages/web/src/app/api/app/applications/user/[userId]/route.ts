import { withApi, z, OPTIONS } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
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

export const GET = withApi({
  auth: 'required',
  rateLimit: 'applications',
  paramsSchema: userParamsSchema,
  querySchema: querySchema,
}, async ({ user, params, query }) => {
  const { userId } = params;
  const { limit, cursor } = query;

  // Verify userId matches token or is admin
  if (user!.uid !== userId && !user!.isAdmin) {
    throw new AuthorizationError(
      "Access denied. You can only access your own applications.",
      "FORBIDDEN"
    );
  }

  const db = getAdminDb();

  // 1. Fetch applications for the user with pagination
  let applicationsQuery = db.collection("applications")
    .where("userId", "==", userId)
    .orderBy("updatedAt", "desc")
    .limit(limit);

  if (cursor) {
    // If cursor is a number (timestamp), parse it, otherwise use as is
    const cursorValue = /^\d+$/.test(cursor) ? parseInt(cursor, 10) : cursor;
    applicationsQuery = applicationsQuery.startAfter(cursorValue);
  }

  const applicationsSnapshot = await applicationsQuery.get();

  if (applicationsSnapshot.empty) {
    return {
      applications: [],
      count: 0,
      nextCursor: null,
      message: 'No applications found',
    };
  }

  const applicationDocs = applicationsSnapshot.docs;

  // 2. Collect all unique job IDs
  const jobIds = [...new Set(applicationDocs.map(doc => doc.data().jobId).filter(Boolean))];

  // 3. Batch fetch all referenced jobs
  const jobDataMap = new Map();
  if (jobIds.length > 0) {
    const jobRefs = jobIds.map(id => db.collection("jobs").doc(id as string));
    const jobSnapshots = await db.getAll(...jobRefs);

    jobSnapshots.forEach(jobDoc => {
      if (jobDoc.exists) {
        jobDataMap.set(jobDoc.id, { id: jobDoc.id, _id: jobDoc.id, ...jobDoc.data() });
      }
    });
  }

  // 4. Map applications and attach job data
  const applications = applicationDocs.map(doc => {
    const data = doc.data();
    const application: any = {
      _id: doc.id,
      id: doc.id,
      ...data,
    };

    if (data.jobId && jobDataMap.has(data.jobId)) {
      const jobData = jobDataMap.get(data.jobId);
      application.job = {
        ...jobData,
        dateFound: jobData.dateFound || jobData.createdAt || Date.now(),
      };
    }

    return application;
  });

  // Calculate nextCursor from the last document's updatedAt
  const lastDoc = applicationDocs[applicationDocs.length - 1];
  const lastUpdatedAt = lastDoc.data().updatedAt;

  // Convert Firestore Timestamp to millis if necessary for consistent cursor usage
  const nextCursor = lastUpdatedAt?.toMillis ? lastUpdatedAt.toMillis() : lastUpdatedAt;

  return {
    applications,
    count: applications.length,
    nextCursor,
    message: 'Applications retrieved successfully',
  };
});
