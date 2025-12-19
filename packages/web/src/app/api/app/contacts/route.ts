import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/firebase/admin";
import { withApi, OPTIONS } from "@/lib/api/withApi";
import type { ContactSubmission } from "@/types/api";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

const contactSubmissionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  subject: z.string().optional().default("General Inquiry"),
});

// POST /api/app/contacts - Create contact form submission
export const POST = withApi({
  auth: "none",
  bodySchema: contactSubmissionSchema,
}, async ({ body }) => {
  const db = getAdminDb();

  // Create contact submission object
  const contactSubmission: Omit<ContactSubmission, "_id"> = {
    name: body.name.trim(),
    email: body.email.toLowerCase().trim(),
    message: body.message.trim(),
    subject: body.subject.trim(),
    status: "new",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Save to Firestore
  const docRef = await db.collection("contacts").add(contactSubmission);

  return {
    message: "Contact form submitted successfully",
    contactId: docRef.id,
  };
});

// GET /api/app/contacts - Get all contact submissions (admin only)
export const GET = withApi({
  auth: "admin",
}, async () => {
  const db = getAdminDb();

  // Fetch from Firestore
  const snapshot = await db
    .collection("contacts")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const contacts: ContactSubmission[] = snapshot.docs.map((doc) => ({
    _id: doc.id,
    ...doc.data(),
  } as ContactSubmission));

  return { contacts };
});
