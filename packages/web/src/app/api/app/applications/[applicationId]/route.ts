import { withApi, z } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { AuthorizationError, NotFoundError } from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";

export const runtime = "nodejs";

const applicationUpdateSchema = z.object({
  status: z.string().optional(),
  appliedDate: z.string().nullable().optional(),
  notes: z.string().optional(),
  interviewDates: z.array(z.string()).optional(),
  followUpDate: z.string().nullable().optional(),
  order: z.number().optional(),
});

const applicationParamsSchema = z.object({
  applicationId: z.string(),
});

export const GET = withApi({
  auth: 'required',
  rateLimit: 'applications',
  paramsSchema: applicationParamsSchema,
}, async ({ user, params }) => {
  const { applicationId } = params;
  const db = getAdminDb();
  const docSnap = await db.collection("applications").doc(applicationId).get();

  if (!docSnap.exists) {
    throw new NotFoundError(
      "Application not found",
      "application",
      ERROR_CODES.APPLICATION_NOT_FOUND
    );
  }

  const applicationData = docSnap.data();
  if (!applicationData || (applicationData.userId !== user!.uid && !user!.isAdmin)) {
    throw new AuthorizationError(
      "Access denied. You can only access your own applications.",
      "FORBIDDEN"
    );
  }

  return {
    id: applicationId,
    application: applicationData
  };
});

export const PUT = withApi({
  auth: 'required',
  rateLimit: 'applications',
  paramsSchema: applicationParamsSchema,
  bodySchema: applicationUpdateSchema,
}, async ({ user, body, params }) => {
  const { applicationId } = params;
  const db = getAdminDb();
  const docRef = db.collection("applications").doc(applicationId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new NotFoundError(
      "Application not found",
      "application",
      ERROR_CODES.APPLICATION_NOT_FOUND
    );
  }

  const applicationData = docSnap.data();
  if (!applicationData || applicationData.userId !== user!.uid) {
    throw new AuthorizationError(
      "Access denied. You can only update your own applications.",
      "FORBIDDEN"
    );
  }

  const updatePayload = {
    ...body,
    updatedAt: new Date().toISOString()
  };

  await docRef.update(updatePayload);
  const updatedDoc = await docRef.get();

  return {
    id: applicationId,
    message: 'Application updated successfully',
    application: updatedDoc.data()
  };
});

export const DELETE = withApi({
  auth: 'required',
  rateLimit: 'applications',
  paramsSchema: applicationParamsSchema,
}, async ({ user, params }) => {
  const { applicationId } = params;
  const db = getAdminDb();
  const docRef = db.collection("applications").doc(applicationId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new NotFoundError(
      "Application not found",
      "application",
      ERROR_CODES.APPLICATION_NOT_FOUND
    );
  }

  const applicationData = docSnap.data();
  if (!applicationData || (applicationData.userId !== user!.uid && !user!.isAdmin)) {
    throw new AuthorizationError(
      "Access denied. You can only delete your own applications.",
      "FORBIDDEN"
    );
  }

  await docRef.delete();
  return { message: 'Application deleted successfully' };
});

export { OPTIONS } from "@/lib/api/withApi";
