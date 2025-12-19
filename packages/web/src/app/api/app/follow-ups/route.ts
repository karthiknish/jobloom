import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withApi, OPTIONS } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

const createFollowUpSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  userId: z.string().min(1, "User ID is required"),
  type: z.string().min(1, "Type is required"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  completed: z.boolean().optional().default(false),
  notes: z.string().optional().default(''),
});

// POST /api/app/follow-ups - Create a new follow-up
export const POST = withApi({
  auth: "required",
  bodySchema: createFollowUpSchema,
}, async ({ body, user }) => {
  // Verify userId matches authenticated user
  if (body.userId !== user!.uid) {
    throw new Error("Unauthorized: User ID mismatch");
  }

  // Initialize Firestore Admin
  const db = getAdminDb();

  // Create follow-up object
  const followUpDataToCreate = {
    applicationId: body.applicationId,
    userId: body.userId,
    type: body.type,
    scheduledDate: body.scheduledDate,
    completed: body.completed,
    notes: body.notes,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Create follow-up in Firestore
  const docRef = await db.collection('followUps').add(followUpDataToCreate);

  return docRef.id;
});

// GET /api/app/follow-ups - Get all follow-ups for the authenticated user
export const GET = withApi({
  auth: "required",
}, async ({ user }) => {
  // Initialize Firestore Admin
  const db = getAdminDb();

  // Get follow-ups for the user
  const snapshot = await db.collection('followUps').where('userId', '==', user!.uid).get();
  const followUps = snapshot.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));

  return followUps;
});

