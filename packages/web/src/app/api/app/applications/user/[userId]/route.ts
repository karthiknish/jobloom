import { withApi, z } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { AuthorizationError } from "@/lib/api/errorResponse";

export const runtime = "nodejs";

const userParamsSchema = z.object({
  userId: z.string(),
});

export const GET = withApi({
  auth: 'required',
  rateLimit: 'applications',
  paramsSchema: userParamsSchema,
}, async ({ user, params }) => {
  const { userId } = params;

  if (user!.uid !== userId && !user!.isAdmin) {
    throw new AuthorizationError(
      "Access denied. You can only access your own applications.",
      "FORBIDDEN"
    );
  }

  const db = getAdminDb();
  const applicationsSnapshot = await db.collection("applications")
    .where("userId", "==", userId)
    .get();

  const applications = [];
  for (const doc of applicationsSnapshot.docs) {
    const data = doc.data();
    let application: any = {
      _id: doc.id,
      jobId: data.jobId,
      userId: data.userId,
      status: data.status,
      appliedDate: data.appliedDate,
      notes: data.notes,
      interviewDates: data.interviewDates,
      followUpDate: data.followUpDate,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      order: data.order
    };

    if (data.jobId) {
      try {
        const jobDoc = await db.collection("jobs").doc(data.jobId).get();
        if (jobDoc.exists) {
          const jobData = jobDoc.data();
          application.job = {
            _id: jobDoc.id,
            title: jobData?.title,
            company: jobData?.company,
            location: jobData?.location,
            url: jobData?.url,
            description: jobData?.description,
            salary: jobData?.salary,
            salaryRange: jobData?.salaryRange,
            skills: jobData?.skills,
            requirements: jobData?.requirements,
            benefits: jobData?.benefits,
            jobType: jobData?.jobType,
            experienceLevel: jobData?.experienceLevel,
            remoteWork: jobData?.remoteWork,
            companySize: jobData?.companySize,
            industry: jobData?.industry,
            postedDate: jobData?.postedDate,
            applicationDeadline: jobData?.applicationDeadline,
            isSponsored: jobData?.isSponsored || false,
            isRecruitmentAgency: jobData?.isRecruitmentAgency,
            sponsorshipType: jobData?.sponsorshipType,
            source: jobData?.source || "manual",
            dateFound: jobData?.dateFound || jobData?.createdAt || Date.now(),
            userId: jobData?.userId
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch job details for job ${data.jobId}:`, error);
      }
    }

    applications.push(application);
  }

  applications.sort((a, b) => {
    if (a.status !== b.status) return a.status.localeCompare(b.status);
    const ao = a.order || 0;
    const bo = b.order || 0;
    if (ao !== bo) return ao - bo;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });

  return applications;
});

export { OPTIONS } from "@/lib/api/withApi";
