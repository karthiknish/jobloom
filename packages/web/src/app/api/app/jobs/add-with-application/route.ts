import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { withApi, OPTIONS } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { normalizeJobUrl, extractJobIdentifier } from "@hireall/shared";
import { AuthorizationError, ValidationError } from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";
import { UsageService } from "@/lib/api/usage";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

export const runtime = "nodejs";

// Combined schema for job and application
const addWithApplicationSchema = z.object({
  // Job Data
  job: z.object({
    title: z.string().min(1, "Title is required").max(500),
    company: z.string().min(1, "Company is required").max(500),
    location: z.string().min(1, "Location is required").max(500),
    url: z.string().url("Invalid URL format"),
    userId: z.string().min(1, "User ID is required"),
    description: z.string().max(50000).optional().default(''),
    salary: z.string().max(200).optional().default(''),
    salaryRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().optional(),
    }).optional().nullable(),
    skills: z.array(z.string()).optional().default([]),
    requirements: z.array(z.string()).optional().default([]),
    benefits: z.array(z.string()).optional().default([]),
    jobType: z.string().max(100).optional().default(''),
    experienceLevel: z.string().max(100).optional().default(''),
    remoteWork: z.boolean().optional().default(false),
    companySize: z.string().max(100).optional().default(''),
    industry: z.string().max(200).optional().default(''),
    postedDate: z.string().max(100).optional().default(''),
    applicationDeadline: z.string().max(100).optional().default(''),
    isSponsored: z.boolean().optional().default(false),
    isRecruitmentAgency: z.boolean().optional().default(false),
    sponsorshipType: z.string().max(100).optional().default(''),
    source: z.string().max(100).optional().default('extension'),
    dateFound: z.number().optional(),
  }),
  // Application Data
  application: z.object({
    status: z.string().min(1, "Status is required"),
    appliedDate: z.string().nullable().optional(),
    notes: z.string().max(10000).optional().default(''),
  })
});

async function checkDuplicateJob(
  db: any,
  url: string,
  userId: string
): Promise<boolean> {
  try {
    const normalizedUrl = normalizeJobUrl(url);
    const jobIdentifier = extractJobIdentifier(url);
    
    // Check by normalized URL
    const urlSnapshot = await db.collection('jobs')
      .where('userId', '==', userId)
      .where('normalizedUrl', '==', normalizedUrl)
      .limit(1)
      .get();
    
    if (!urlSnapshot.empty) return true;
    
    // Check by job identifier if different
    if (jobIdentifier !== normalizedUrl) {
      const idSnapshot = await db.collection('jobs')
        .where('userId', '==', userId)
        .where('jobIdentifier', '==', jobIdentifier)
        .limit(1)
        .get();
      
      if (!idSnapshot.empty) return true;
    }
    
    return false;
  } catch (error) {
    console.warn('Duplicate check failed:', error);
    return false;
  }
}

// POST /api/app/jobs/add-with-application
export const POST = withApi({
  auth: 'required',
  rateLimit: 'job-add',
  bodySchema: addWithApplicationSchema,
}, async ({ user, body }) => {
  const { job, application } = body;

  // Verify userId matches authenticated user
  if (job.userId !== user!.uid) {
    throw new AuthorizationError(
      'User ID does not match authentication token',
      'FORBIDDEN'
    );
  }

  const db = getAdminDb();

  // 1. Check for duplicate job
  const isDuplicate = await checkDuplicateJob(db, job.url, job.userId);
  if (isDuplicate) {
    throw new ValidationError(
      'A job with this URL already exists in your board',
      'url',
      ERROR_CODES.DUPLICATE_RECORD
    );
  }

  // 2. Enforce application limits
  await UsageService.checkFeatureLimit(user!.uid, 'applicationsPerMonth');

  // 3. Perform atomic batch write
  const batch = db.batch();
  const jobRef = db.collection('jobs').doc();
  const appRef = db.collection('applications').doc();

  const now = Date.now();
  const normalizedUrl = normalizeJobUrl(job.url);
  const jobIdentifier = extractJobIdentifier(job.url);

  // Prepare Job Data
  const jobDataToCreate = {
    ...job,
    title: job.title.trim(),
    company: job.company.trim(),
    location: job.location.trim(),
    url: job.url.trim(),
    normalizedUrl,
    jobIdentifier,
    description: job.description?.trim() || '',
    salary: job.salary?.trim() || '',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    dateFound: job.dateFound || now,
  };

  // Prepare Application Data
  const appDataToCreate = {
    jobId: jobRef.id,
    userId: user!.uid,
    status: application.status.trim(),
    appliedDate: application.appliedDate || null,
    notes: (application.notes || '').trim(),
    followUps: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  batch.set(jobRef, jobDataToCreate);
  batch.set(appRef, appDataToCreate);

  await batch.commit();

  return {
    jobId: jobRef.id,
    applicationId: appRef.id,
    message: 'Job and Application created successfully',
  };
});
