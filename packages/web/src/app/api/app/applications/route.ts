import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { withApi, OPTIONS } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { AuthorizationError } from "@/lib/api/errorResponse";
import { UsageService } from "@/lib/api/usage";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createApplicationSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  userId: z.string().min(1, "User ID is required"),
  status: z.string().min(1, "Status is required"),
  appliedDate: z.string().nullable().optional(),
  notes: z.string().max(10000).optional().default(''),
  followUps: z.array(z.object({
    date: z.string(),
    type: z.string(),
    notes: z.string().optional(),
  })).optional().default([]),
});

// ============================================================================
// API HANDLERS
// ============================================================================

// POST /api/app/applications - Create a new application
export const POST = withApi({
  auth: 'required',
  rateLimit: 'applications',
  bodySchema: createApplicationSchema,
}, async ({ user, body }) => {
  // Verify userId matches authenticated user
  if (body.userId !== user!.uid) {
    throw new AuthorizationError(
      'User ID does not match authentication token',
      'FORBIDDEN'
    );
  }

  const userId = body.userId.trim();
  
  // Enforce application limits
  await UsageService.checkFeatureLimit(userId, 'applicationsPerMonth');

  const db = getAdminDb();

  // Create application object
  const applicationDataToCreate = {
    jobId: body.jobId.trim(),
    userId: body.userId.trim(),
    status: body.status.trim(),
    appliedDate: body.appliedDate || null,
    notes: (body.notes || '').trim(),
    followUps: body.followUps || [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Create application in Firestore
  const docRef = await db.collection('applications').add(applicationDataToCreate);

  return {
    id: docRef.id,
    message: 'Application created successfully',
    createdAt: Date.now(),
  };
});

// GET /api/app/applications - Get all applications (admin only)
export const GET = withApi({
  auth: 'admin',
  rateLimit: 'admin',
}, async () => {
  const db = getAdminDb();
  
  const snapshot = await db.collection('applications').get();
  const applications = snapshot.docs.map(doc => ({ 
    _id: doc.id, 
    id: doc.id, 
    ...doc.data() 
  }));

  return {
    applications,
    count: applications.length,
    message: 'Applications retrieved successfully',
  };
});
