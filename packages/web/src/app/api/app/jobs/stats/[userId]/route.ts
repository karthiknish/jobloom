import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb } from "@/firebase/admin";
import {
  withErrorHandling,
  validateAuthHeader,
  createAuthorizationError,
  generateRequestId
} from "@/lib/api/errors";

// GET /api/app/jobs/stats/[userId] - Get job statistics for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const requestId = generateRequestId();
  const { userId } = await params;

  return withErrorHandling(async () => {
    // Validate authorization
    const token = validateAuthHeader(request);
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      throw createAuthorizationError("Invalid authentication token", 'INVALID_TOKEN');
    }

    // Users can only access their own stats unless they're admin
    if (decodedToken.uid !== userId) {
      // Check if user is admin
      const db = getAdminDb();
      const userDoc = await db.collection("users").doc(decodedToken.uid).get();
      if (!userDoc.exists || !userDoc.data()?.isAdmin) {
        throw createAuthorizationError("Access denied. You can only access your own statistics.", 'INSUFFICIENT_PERMISSIONS');
      }
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

    const jobStats = {
      totalJobs,
      sponsoredJobs,
      totalApplications: applicationsSnapshot.size,
      jobsToday,
      recruitmentAgencyJobs,
      byStatus
    };

    return NextResponse.json(jobStats);
  }, {
    endpoint: '/api/app/jobs/stats/[userId]',
    method: 'GET',
    requestId,
    userId
  });
}
