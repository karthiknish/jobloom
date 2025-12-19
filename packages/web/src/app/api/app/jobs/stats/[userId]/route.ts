import { getAdminDb } from "@/firebase/admin";
import { withApi, z, OPTIONS } from "@/lib/api/withApi";
import { ERROR_CODES } from "@/lib/api/errorCodes";

export { OPTIONS };

const statsParamsSchema = z.object({
  userId: z.string(),
});

// GET /api/app/jobs/stats/[userId] - Get job statistics for a user
export const GET = withApi({
  auth: 'required',
  paramsSchema: statsParamsSchema,
}, async ({ user, params }) => {
  const { userId } = params;

  // Users can only access their own stats unless they're admin
  if (user!.uid !== userId && !user!.isAdmin) {
    return {
      error: "Access denied. You can only access your own statistics.",
      code: ERROR_CODES.FORBIDDEN,
    };
  }

  // Fetch job statistics from Firestore
  const db = getAdminDb();
  const jobsSnapshot = await db.collection("jobs")
    .where("userId", "==", userId)
    .get();

  const applicationsSnapshot = await db.collection("applications")
    .where("userId", "==", userId)
    .get();

  const totalJobs = jobsSnapshot.size;
  let sponsoredJobs = 0;
  let recruitmentAgencyJobs = 0;
  let jobsToday = 0;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startTs = startOfToday.getTime();

  jobsSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.isSponsored) sponsoredJobs++;
    if (data.isRecruitmentAgency) recruitmentAgencyJobs++;
    const ts = data.dateFound || data.createdAt || 0;
    if (typeof ts === "number" && ts >= startTs) jobsToday++;
  });

  const byStatus: Record<string, number> = {};
  applicationsSnapshot.forEach(doc => {
    const status = doc.data().status || "interested";
    byStatus[status] = (byStatus[status] || 0) + 1;
  });

  return {
    totalJobs,
    sponsoredJobs,
    totalApplications: applicationsSnapshot.size,
    jobsToday,
    recruitmentAgencyJobs,
    byStatus
  };
});
