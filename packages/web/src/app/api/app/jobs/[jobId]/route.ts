import { withApi, z } from "@/lib/api/withApi";
import { AuthorizationError, NotFoundError } from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";
import { getConvexClient } from "@/lib/convex";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";

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
    period: z.string().optional(),
  }).optional().nullable(),
  remoteWork: z.boolean().optional(),
  isSponsored: z.boolean().optional(),
  isRecruitmentAgency: z.boolean().optional(),
  skills: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  status: z.enum([
    "interested",
    "applied",
    "interviewing",
    "offered",
    "rejected",
    "withdrawn"
  ]).optional(),
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
  const convex = getConvexClient();

  // Validate that jobId is a valid Convex ID format if possible, or try catch
  // Convex IDs are strings, but specific format.
  
  let job;
  try {
     job = await convex.query(api.jobs.getById, { id: jobId as Id<"jobs"> });
  } catch (e) {
     // If ID format is invalid, convex might throw
     throw new NotFoundError('Job not found', 'job', ERROR_CODES.JOB_NOT_FOUND);
  }
  
  if (!job) {
    throw new NotFoundError('Job not found', 'job', ERROR_CODES.JOB_NOT_FOUND);
  }
  
  // Note: getById doesn't check auth, so we must check if the user is allowed to see this job.
  // Assuming jobs are private to the user.
  
  const convexUser = await convex.query(api.users.getByFirebaseUid, { firebaseUid: user!.uid });
  
  if (!convexUser) {
      // This should technically not happen if user is authenticated via Firebase and synced
      throw new AuthorizationError('User not found in database', 'UNAUTHORIZED');
  }

  if (job.userId !== convexUser._id) {
     throw new AuthorizationError(
       'You do not have permission to view this job',
       'FORBIDDEN'
     );
  }

  return { job, message: 'Job retrieved successfully' };
});

export const PUT = withApi({
  auth: 'required',
  rateLimit: 'jobs',
  paramsSchema: jobParamsSchema,
  bodySchema: jobUpdateSchema,
}, async ({ user, body, params }) => {
  const { jobId } = params;
  const convex = getConvexClient();
  
  let job;
  try {
     job = await convex.query(api.jobs.getById, { id: jobId as Id<"jobs"> });
  } catch (e) {
     throw new NotFoundError('Job not found', 'job', ERROR_CODES.JOB_NOT_FOUND);
  }

  if (!job) {
    throw new NotFoundError('Job not found', 'job', ERROR_CODES.JOB_NOT_FOUND);
  }

  const convexUser = await convex.query(api.users.getByFirebaseUid, { firebaseUid: user!.uid });
  
  if (!convexUser) {
      throw new AuthorizationError('User not found in database', 'UNAUTHORIZED');
  }

  if (job.userId !== convexUser._id) {
    throw new AuthorizationError(
      'You do not have permission to update this job',
      'FORBIDDEN'
    );
  }

  await convex.mutation(api.jobs.update, {
    id: jobId as Id<"jobs">,
    updates: {
      ...body,
      salaryRange: body.salaryRange === null ? undefined : body.salaryRange,
    }
  });

  return { message: 'Job updated successfully' };
});

export const DELETE = withApi({
  auth: 'required',
  rateLimit: 'jobs',
  paramsSchema: jobParamsSchema,
}, async ({ user, params }) => {
  const { jobId } = params;
  const convex = getConvexClient();

  let job;
  try {
     job = await convex.query(api.jobs.getById, { id: jobId as Id<"jobs"> });
  } catch (e) {
     throw new NotFoundError('Job not found', 'job', ERROR_CODES.JOB_NOT_FOUND);
  }

  if (!job) {
    throw new NotFoundError('Job not found', 'job', ERROR_CODES.JOB_NOT_FOUND);
  }

  const convexUser = await convex.query(api.users.getByFirebaseUid, { firebaseUid: user!.uid });
  
  if (!convexUser) {
      throw new AuthorizationError('User not found in database', 'UNAUTHORIZED');
  }

  if (job.userId !== convexUser._id) {
    throw new AuthorizationError(
      'You do not have permission to delete this job',
      'FORBIDDEN'
    );
  }

  await convex.mutation(api.jobs.remove, { id: jobId as Id<"jobs"> });
  return { message: 'Job deleted successfully' };
});

export { OPTIONS } from "@/lib/api/withApi";
