import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { withApi, OPTIONS } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { normalizeJobUrl, extractJobIdentifier } from "@hireall/shared";
import { AuthorizationError } from "@/lib/api/errorResponse";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const importJobItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  location: z.string().min(1, "Location is required"),
  url: z.string().url("Invalid URL format"),
  description: z.string().optional(),
  salary: z.string().optional(),
  isSponsored: z.boolean().optional().default(false),
  isRecruitmentAgency: z.boolean().optional().default(false),
  source: z.string().optional().default('csv'),
  dateFound: z.number().optional(),
});

const importJobsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  jobs: z.array(importJobItemSchema),
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

// POST /api/app/jobs/import - Bulk import jobs
export const POST = withApi({
  auth: 'required',
  rateLimit: 'job-add',
  bodySchema: importJobsSchema,
}, async ({ user, body }) => {
  // Verify userId matches authenticated user
  if (body.userId !== user!.uid) {
    throw new AuthorizationError(
      'User ID does not match authentication token',
      'FORBIDDEN'
    );
  }

  const db = getAdminDb();
  const { userId, jobs } = body;
  const now = Date.now();
  
  let importedCount = 0;
  let skippedCount = 0;

  // Process jobs in parallel chunks or sequences?
  // Since we need to check for duplicates, sequencing is safer for local duplicates 
  // but for global duplicates, we can do some parallelism.
  // For simplicity and robustness against massive imports, we'll process them in a loop.
  
  for (const job of jobs) {
    try {
      // Check for duplicate job
      const isDuplicate = await checkDuplicateJob(db, job.url, userId);
      
      if (isDuplicate) {
        skippedCount++;
        continue;
      }

      const normalizedUrl = normalizeJobUrl(job.url);
      const jobIdentifier = extractJobIdentifier(job.url);

      const jobDataToCreate = {
        title: job.title.trim(),
        company: job.company.trim(),
        location: job.location.trim(),
        url: job.url.trim(),
        normalizedUrl,
        jobIdentifier,
        description: job.description?.trim() || '',
        salary: job.salary?.trim() || '',
        isSponsored: Boolean(job.isSponsored),
        isRecruitmentAgency: Boolean(job.isRecruitmentAgency),
        source: job.source?.trim() || 'csv',
        userId: userId,
        dateFound: job.dateFound || now,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await db.collection('jobs').add(jobDataToCreate);
      importedCount++;
    } catch (error) {
      console.error(`Failed to import job: ${job.title} from ${job.company}`, error);
      // We continue with other jobs even if one fails
      skippedCount++;
    }
  }

  return {
    importedCount,
    skippedCount,
    message: `Successfully imported ${importedCount} jobs. ${skippedCount} items were skipped or were duplicates.`,
  };
});
