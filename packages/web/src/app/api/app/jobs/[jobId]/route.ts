import { withApi, z } from "@/lib/api/withApi";
import { getAdminDb, FieldValue } from "@/firebase/admin";
import { AuthorizationError, NotFoundError } from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";

export const runtime = "nodejs";

const jobUpdateSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  url: z.string().url().optional(),
  description: z.string().optional(),
  salary: z.string().max(200).optional(),
  salaryRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().optional(),
  }).optional().nullable(),
  remoteWork: z.boolean().optional(),
  isSponsored: z.boolean().optional(),
  isRecruitmentAgency: z.boolean().optional(),
  skills: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  status: z.string().optional(),
});

const jobParamsSchema = z.object({
  jobId: z.string(),
});

export const GET = withApi({
  auth: 'required',
  rateLimit: 'jobs',
  paramsSchema: jobParamsSchema,
}, async ({ user, params }) => {
  const { jobId } = params;
  const db = getAdminDb();
  const docSnap = await db.collection('jobs').doc(jobId).get();
  
  if (!docSnap.exists) {
    throw new NotFoundError('Job not found', 'job', ERROR_CODES.JOB_NOT_FOUND);
  }

  const job = { _id: docSnap.id, id: docSnap.id, ...docSnap.data() };
  return { job, message: 'Job retrieved successfully' };
});

export const PUT = withApi({
  auth: 'required',
  rateLimit: 'jobs',
  paramsSchema: jobParamsSchema,
  bodySchema: jobUpdateSchema,
}, async ({ user, body, params }) => {
  const { jobId } = params;
  const db = getAdminDb();
  const docRef = db.collection('jobs').doc(jobId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new NotFoundError('Job not found', 'job', ERROR_CODES.JOB_NOT_FOUND);
  }

  if (docSnap.data()?.userId !== user!.uid) {
    throw new AuthorizationError(
      'You do not have permission to update this job',
      'FORBIDDEN'
    );
  }

  await docRef.update({
    ...body,
    updatedAt: FieldValue.serverTimestamp()
  });

  return { message: 'Job updated successfully' };
});

export const DELETE = withApi({
  auth: 'required',
  rateLimit: 'jobs',
  paramsSchema: jobParamsSchema,
}, async ({ user, params }) => {
  const { jobId } = params;
  const db = getAdminDb();
  const docRef = db.collection('jobs').doc(jobId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new NotFoundError('Job not found', 'job', ERROR_CODES.JOB_NOT_FOUND);
  }

  if (docSnap.data()?.userId !== user!.uid) {
    throw new AuthorizationError(
      'You do not have permission to delete this job',
      'FORBIDDEN'
    );
  }

  await docRef.delete();
  return { message: 'Job deleted successfully' };
});

export { OPTIONS } from "@/lib/api/withApi";
