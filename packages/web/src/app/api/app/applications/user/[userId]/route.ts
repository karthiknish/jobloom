import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";
import { applyCorsHeaders, preflightResponse } from "@/lib/api/cors";

import {
  withErrorHandling,
  createAuthorizationError,
  generateRequestId
} from "@/lib/api/errors";

// GET /api/app/applications/user/[userId] - Get applications for a user

interface ApplicationWithJob {
  _id: string;
  jobId?: string;
  userId: string;
  status: string;
  appliedDate?: any;
  notes?: any;
  interviewDates?: any;
  followUpDate?: any;
  createdAt?: any;
  updatedAt?: any;
  order?: number;
  job?: {
    _id: string;
    title?: any;
    company?: any;
    location?: any;
    url?: any;
    description?: any;
    salary?: any;
    salaryRange?: any;
    skills?: any;
    requirements?: any;
    benefits?: any;
    jobType?: any;
    experienceLevel?: any;
    remoteWork?: any;
    companySize?: any;
    industry?: any;
    postedDate?: any;
    applicationDeadline?: any;
    isSponsored?: boolean;
    isRecruitmentAgency?: any;
    sponsorshipType?: any;
    source?: string;
    dateFound?: any;
    userId?: any;
  };
}

// GET /api/app/applications/user/[userId] - Get applications for a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const requestId = generateRequestId();
  const { userId } = await params;

  const response = await withErrorHandling(async () => {
    // Validate authorization
    const decodedToken = await verifySessionFromRequest(request);
    if (!decodedToken) {
      throw createAuthorizationError("Invalid authentication token", 'INVALID_TOKEN');
    }

    // Users can only access their own applications unless they're admin
    if (decodedToken.uid !== userId) {
      // Check if user is admin
      const db = getAdminDb();
      const userDoc = await db.collection("users").doc(decodedToken.uid).get();
      if (!userDoc.exists || !userDoc.data()?.isAdmin) {
        throw createAuthorizationError("Access denied. You can only access your own applications.", 'INSUFFICIENT_PERMISSIONS');
      }
    }

    // Fetch applications from Firestore using admin API
    const db = getAdminDb();
    const applicationsSnapshot = await db.collection("applications")
      .where("userId", "==", userId)
      .get();

    const applications = [];
    for (const doc of applicationsSnapshot.docs) {
      const data = doc.data();
      let application: ApplicationWithJob = {
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

      // Fetch job details if jobId exists
      if (data.jobId) {
        try {
          const jobDoc = await db.collection("jobs").doc(data.jobId).get();
          if (jobDoc.exists) {
            const jobData = jobDoc.data();
            application = {
              ...application,
              job: {
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
              }
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch job details for job ${data.jobId}:`, error);
        }
      }

      applications.push(application);
    }

    // Sort by status then order then updatedAt desc
    applications.sort((a, b) => {
      if (a.status !== b.status) return a.status.localeCompare(b.status);
      const ao = a.order || 0;
      const bo = b.order || 0;
      if (ao !== bo) return ao - bo;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    return NextResponse.json(applications);
  }, {
    endpoint: '/api/app/applications/user/[userId]',
    method: 'GET',
    requestId,
    userId
  });

  return applyCorsHeaders(response, request);
}



// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request);
}
