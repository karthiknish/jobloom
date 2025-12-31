import { withApi, z, OPTIONS } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { AuthorizationError } from "@/lib/api/errorResponse";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

export const runtime = "nodejs";

const userParamsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const GET = withApi({
  auth: 'required',
  rateLimit: 'applications',
  paramsSchema: userParamsSchema,
}, async ({ user, params }) => {
  const { userId } = params;

  // Verify userId matches token or is admin
  if (user!.uid !== userId && !user!.isAdmin) {
    throw new AuthorizationError(
      "Access denied. You can only access your own applications.",
      "FORBIDDEN"
    );
  }

  const db = getAdminDb();
  
  // 1. Fetch all applications for the user
  // 1. Fetch all applications for the user
  const applicationsSnapshot = await db.collection("applications")
    .where("userId", "==", userId)
    .get();

  if (applicationsSnapshot.empty) {
    return {
      applications: [],
      count: 0,
      message: 'No applications found',
    };
  }

  // 2. Collect all unique job IDs
  const applicationDocs = applicationsSnapshot.docs;
  const jobIds = [...new Set(applicationDocs.map(doc => doc.data().jobId).filter(Boolean))];
  
  // 3. Batch fetch all referenced jobs
  const jobDataMap = new Map();
  if (jobIds.length > 0) {
    // Firestore getAll takes up to 1000 document references
    const jobRefs = jobIds.map(id => db.collection("jobs").doc(id));
    const jobSnapshots = await db.getAll(...jobRefs);
    
    jobSnapshots.forEach(jobDoc => {
      if (jobDoc.exists) {
        jobDataMap.set(jobDoc.id, { id: jobDoc.id, _id: jobDoc.id, ...jobDoc.data() });
      }
    });
  }

  // 4. Map applications and attach job data from local map
  const applications = applicationDocs.map(doc => {
    const data = doc.data();
    const application: any = {
      _id: doc.id,
      id: doc.id,
      jobId: data.jobId,
      userId: data.userId,
      status: data.status,
      appliedDate: data.appliedDate,
      notes: data.notes,
      followUpDate: data.followUpDate,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      order: data.order
    };

    if (data.jobId && jobDataMap.has(data.jobId)) {
      const jobData = jobDataMap.get(data.jobId);
      application.job = {
        ...jobData,
        // Ensure dateFound fallback exists
        dateFound: jobData.dateFound || jobData.createdAt || Date.now(),
      };
    }

    return application;
  });

  // 5. Sort applications
  applications.sort((a, b) => {
    // Sort by status if different
    if (a.status !== b.status) return (a.status || '').localeCompare(b.status || '');
    
    // Then by order within same status
    const ao = a.order || 0;
    const bo = b.order || 0;
    if (ao !== bo) return ao - bo;
    
    // Finally by most recently updated
    const timeA = a.updatedAt?.toMillis?.() || new Date(a.updatedAt).getTime() || 0;
    const timeB = b.updatedAt?.toMillis?.() || new Date(b.updatedAt).getTime() || 0;
    return timeB - timeA;
  });

  return {
    applications,
    count: applications.length,
    message: 'Applications retrieved successfully',
  };
});
