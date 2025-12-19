import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/firebase/admin";
import { withApi, OPTIONS } from "@/lib/api/withApi";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

// GET /api/contact/[id] - Get a specific contact (admin only)
export const GET = withApi({
  auth: "admin",
}, async ({ params }) => {
  const db = getAdminDb();
  const contactDoc = await db.collection('contacts').doc(params.id).get();
  
  if (!contactDoc.exists) {
    throw new Error("Contact not found");
  }

  return {
    contact: {
      id: contactDoc.id,
      ...contactDoc.data()
    }
  };
});

const updateContactSchema = z.object({
  status: z.string().optional(),
  response: z.string().optional(),
});

// PUT /api/contact/[id] - Update a specific contact (admin only)
export const PUT = withApi({
  auth: "admin",
  bodySchema: updateContactSchema,
}, async ({ params, body }) => {
  const { status, response } = body;
  const db = getAdminDb();
  
  const updateData: any = {
    updatedAt: new Date().toISOString()
  };

  if (status) {
    updateData.status = status;
  }

  if (response) {
    updateData.response = response;
    updateData.respondedAt = new Date().toISOString();
  }

  const contactRef = db.collection('contacts').doc(params.id);
  await contactRef.update(updateData);

  return {
    message: "Contact updated successfully"
  };
});

// DELETE /api/contact/[id] - Delete a specific contact (admin only)
export const DELETE = withApi({
  auth: "admin",
}, async ({ params }) => {
  const db = getAdminDb();
  await db.collection('contacts').doc(params.id).delete();

  return {
    message: "Contact deleted successfully"
  };
});
