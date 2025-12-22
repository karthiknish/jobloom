import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { withApi, OPTIONS } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { normalizeJobUrl, extractJobIdentifier } from "@/lib/utils/urlNormalizer";
import { AuthorizationError, ValidationError } from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const salaryRangeSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  currency: z.string().optional(),
}).optional().nullable();

const createJobSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  company: z.string().min(1, "Company is required").max(500),
  location: z.string().min(1, "Location is required").max(500),
  url: z.string().url("Invalid URL format"),
  userId: z.string().min(1, "User ID is required"),
  description: z.string().max(50000).optional().default(''),
  salary: z.string().max(200).optional().default(''),
  salaryRange: salaryRangeSchema,
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
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function checkDuplicateJob(
  db: ReturnType<typeof getAdminDb>,
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
    
    // Fallback: check exact URL match
    const exactSnapshot = await db.collection('jobs')
      .where('userId', '==', userId)
      .where('url', '==', url.trim())
      .limit(1)
      .get();
    
    return !exactSnapshot.empty;
  } catch (error) {
    console.warn('Duplicate check failed:', error);
    return false;
  }
}

// ============================================================================
// API HANDLERS
// ============================================================================

// POST /api/app/jobs - Create a new job
export const POST = withApi({
  auth: 'required',
  rateLimit: 'job-add',
  bodySchema: createJobSchema,
}, async ({ user, body }) => {
  // Verify userId matches authenticated user
  if (body.userId !== user!.uid) {
    throw new AuthorizationError(
      'User ID does not match authentication token',
      'FORBIDDEN'
    );
  }

  const db = getAdminDb();

  // Check for duplicate job
  const isDuplicate = await checkDuplicateJob(db, body.url, body.userId);
  if (isDuplicate) {
    throw new ValidationError(
      'A job with this URL already exists in your board',
      'url',
      ERROR_CODES.DUPLICATE_RECORD
    );
  }

  // Prepare job data
  const now = Date.now();
  const normalizedUrl = normalizeJobUrl(body.url);
  const jobIdentifier = extractJobIdentifier(body.url);
  
  const jobDataToCreate = {
    title: body.title.trim(),
    company: body.company.trim(),
    location: body.location.trim(),
    url: body.url.trim(),
    normalizedUrl,
    jobIdentifier,
    description: body.description?.trim() || '',
    salary: body.salary?.trim() || '',
    salaryRange: body.salaryRange || null,
    skills: body.skills || [],
    requirements: body.requirements || [],
    benefits: body.benefits || [],
    jobType: body.jobType?.trim() || '',
    experienceLevel: body.experienceLevel?.trim() || '',
    remoteWork: Boolean(body.remoteWork),
    companySize: body.companySize?.trim() || '',
    industry: body.industry?.trim() || '',
    postedDate: body.postedDate?.trim() || '',
    applicationDeadline: body.applicationDeadline?.trim() || '',
    isSponsored: Boolean(body.isSponsored),
    isRecruitmentAgency: Boolean(body.isRecruitmentAgency),
    sponsorshipType: body.sponsorshipType?.trim() || '',
    source: body.source?.trim() || 'extension',
    userId: body.userId,
    dateFound: body.dateFound || now,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Create job in Firestore
  const docRef = await db.collection('jobs').add(jobDataToCreate);

  return {
    id: docRef.id,
    message: 'Job created successfully',
  };
});

// GET /api/app/jobs - Get all jobs (admin only)
export const GET = withApi({
  auth: 'admin',
  rateLimit: 'admin',
}, async () => {
  const db = getAdminDb();
  
  const snapshot = await db.collection('jobs').get();
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
