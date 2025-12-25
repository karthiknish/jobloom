import { getAdminDb } from "@/firebase/admin";
import { withApi, z, OPTIONS } from "@/lib/api/withApi";
import type { ContactSubmission } from "@/types/api";
import { NotFoundError } from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";

export { OPTIONS };

const contactParamsSchema = z.object({
  contactId: z.string(),
});

const contactUpdateSchema = z.object({
  status: z.enum(['new', 'read', 'responded', 'archived']).optional(),
  response: z.string().optional(),
});

// GET /api/app/contacts/admin/[contactId] - Get a specific contact submission (admin only)
export const GET = withApi({
  auth: 'admin',
  rateLimit: 'admin',
  paramsSchema: contactParamsSchema,
}, async ({ params }) => {
  const { contactId } = params;
  const db = getAdminDb();

  // Fetch contact submission
  const docRef = db.collection('contacts').doc(contactId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new NotFoundError(
      "Contact submission not found",
      "contact",
      ERROR_CODES.CONTENT_NOT_FOUND
    );
  }

  const contact: ContactSubmission = {
    _id: docSnap.id,
    ...docSnap.data(),
  } as ContactSubmission;

  return { contact };
});

// PUT /api/app/contacts/admin/[contactId] - Update a contact submission (admin only)
export const PUT = withApi({
  auth: 'admin',
  rateLimit: 'admin',
  paramsSchema: contactParamsSchema,
  bodySchema: contactUpdateSchema,
}, async ({ params, body, user }) => {
  const { contactId } = params;
  const db = getAdminDb();

  // Add metadata for updates
  const updates: any = {
    ...body,
    updatedAt: Date.now(),
  };

  if (body.status === 'responded' && body.response) {
    updates.respondedAt = Date.now();
    updates.respondedBy = user!.uid;
  }

  // Update contact submission
  const docRef = db.collection('contacts').doc(contactId);
  await docRef.update(updates);

  return {
    success: true,
    message: "Contact submission updated successfully"
  };
});

// DELETE /api/app/contacts/admin/[contactId] - Delete a contact submission (admin only)
export const DELETE = withApi({
  auth: 'admin',
  rateLimit: 'admin',
  paramsSchema: contactParamsSchema,
}, async ({ params }) => {
  const { contactId } = params;
  const db = getAdminDb();

  // Delete contact submission
  const docRef = db.collection('contacts').doc(contactId);
  await docRef.delete();

  return {
    success: true,
    message: "Contact submission deleted successfully"
  };
});
