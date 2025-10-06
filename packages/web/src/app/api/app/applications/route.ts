import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";
import { createFirestoreCollection } from "@/firebase/firestore";
import { getAdminFirestore } from "@/firebase/admin";
import {

// CORS helper function for LinkedIn extension
function addCorsHeaders(response, origin) {
  const allowedOrigins = [
    'https://www.linkedin.com',
    'https://linkedin.com',
    process.env.NEXT_PUBLIC_WEB_URL || 'https://hireall.app',
    'http://localhost:3000',
  ];

  const requestOrigin = origin;

  if (requestOrigin && (allowedOrigins.includes(requestOrigin) || 
      requestOrigin.includes('hireall.app') || 
      requestOrigin.includes('vercel.app') || 
      requestOrigin.includes('netlify.app'))) {
    response.headers.set('Access-Control-Allow-Origin', requestOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  } else if (process.env.NODE_ENV === 'development') {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  }

  return response;
}
  withErrorHandling,
  validateRequiredFields,
  validateId,
  createValidationError,
  createAuthorizationError,
  generateRequestId
} from "@/lib/api/errors";

// POST /api/app/applications - Create a new application
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  return withErrorHandling(async () => {
    // Validate authorization
    const decodedToken = await verifySessionFromRequest(request);
    if (!decodedToken) {
      throw createAuthorizationError("Invalid authentication token", 'INVALID_TOKEN');
    }

    // Validate and parse request body
    const applicationData = await request.json();
    validateRequiredFields(applicationData, ['jobId', 'userId', 'status']);
    validateId(applicationData.jobId, 'jobId');
    validateId(applicationData.userId, 'userId');

    // Verify userId matches token
    if (applicationData.userId !== decodedToken.uid) {
      throw createAuthorizationError("User ID does not match authentication token", 'USER_ID_MISMATCH');
    }

    // Initialize Firestore
    const applicationsCollection = createFirestoreCollection<any>('applications');

    // Create application object with validation
    const applicationDataToCreate = {
      jobId: applicationData.jobId.trim(),
      userId: applicationData.userId.trim(),
      status: applicationData.status.trim(),
      appliedDate: applicationData.appliedDate || null,
      interviewDate: applicationData.interviewDate || null,
      notes: (applicationData.notes || '').trim(),
      followUps: Array.isArray(applicationData.followUps) ? applicationData.followUps : [],
      createdAt: startTime,
      updatedAt: startTime
    };

    // Create application in Firestore
    const createdApplication = await applicationsCollection.create(applicationDataToCreate);

    return NextResponse.json({
      id: createdApplication._id,
      message: 'Application created successfully',
      createdAt: startTime
    });

  }, {
    endpoint: '/api/app/applications',
    method: 'POST',
    requestId
  });
}

// GET /api/app/applications - Get all applications (admin only)
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    // Validate authorization
    const decodedToken = await verifySessionFromRequest(request);
    if (!decodedToken) {
      throw createAuthorizationError("Invalid authentication token", 'INVALID_TOKEN');
    }

    // TODO: Add admin check - for now return all applications
    // if (!decodedToken.admin) {
    //   throw createAuthorizationError("Admin access required", 'INSUFFICIENT_PERMISSIONS');
    // }

    // Initialize Firestore
    const applicationsCollection = createFirestoreCollection<any>('applications');

    // Get all applications (admin only)
    const applications = await applicationsCollection.getAll();

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
}


// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin || undefined);
}
