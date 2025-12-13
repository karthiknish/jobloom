import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import {
  withErrorHandling,
  validateRequiredFields,
  validateId,
  createAuthorizationError,
  generateRequestId
} from "@/lib/api/errors";
import { applyCorsHeaders, preflightResponse } from "@/lib/api/cors";
import { FieldValue } from "firebase-admin/firestore";

// POST /api/app/applications - Create a new application
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  const response = await withErrorHandling(async () => {
    const auth = await authenticateRequest(request);

    if (!auth.ok) {
      return auth.response;
    }

    // Validate and parse request body
    const applicationData = await request.json();
    validateRequiredFields(applicationData, ['jobId', 'userId', 'status']);
    validateId(applicationData.jobId, 'jobId');
    validateId(applicationData.userId, 'userId');

    // Verify userId matches token
    if (applicationData.userId !== auth.token.uid) {
      throw createAuthorizationError("User ID does not match authentication token", 'USER_ID_MISMATCH');
    }

    // Initialize Firestore Admin
    const db = getAdminDb();

    // Create application object with validation
    const applicationDataToCreate = {
      jobId: applicationData.jobId.trim(),
      userId: applicationData.userId.trim(),
      status: applicationData.status.trim(),
      appliedDate: applicationData.appliedDate || null,
      interviewDate: applicationData.interviewDate || null,
      notes: (applicationData.notes || '').trim(),
      followUps: Array.isArray(applicationData.followUps) ? applicationData.followUps : [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    // Create application in Firestore
    const docRef = await db.collection('applications').add(applicationDataToCreate);

    return NextResponse.json({
      id: docRef.id,
      message: 'Application created successfully',
      createdAt: startTime
    });

  }, {
    endpoint: '/api/app/applications',
    method: 'POST',
    requestId
  });

  return applyCorsHeaders(response, request);
}

// GET /api/app/applications - Get all applications (admin only)
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  const response = await withErrorHandling(async () => {
    // Validate authorization
    const auth = await authenticateRequest(request, {
      loadUser: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    if (!auth.isAdmin) {
      throw createAuthorizationError("Admin access required", 'INSUFFICIENT_PERMISSIONS');
    }

    // Initialize Firestore Admin
    const db = getAdminDb();

    // Get all applications (admin only)
    const snapshot = await db.collection('applications').get();
    const applications = snapshot.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));

    return NextResponse.json({
      applications,
      count: applications.length,
      message: 'Applications retrieved successfully'
    });

  }, {
    endpoint: '/api/app/applications',
    method: 'GET',
    requestId,
    userId: undefined // Will be set by middleware if needed
  });

  return applyCorsHeaders(response, request);
}


// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request);
}

