import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { getAdminDb } from "@/firebase/admin";
import { applyCorsHeaders, preflightResponse } from "@/lib/api/cors";
import { withErrorHandling, createAuthorizationError, generateRequestId } from "@/lib/api/errors";

// PUT /api/app/applications/[applicationId] - Update an application
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const requestId = generateRequestId();
  const { applicationId } = await params;

  const response = await withErrorHandling(async () => {
    const auth = await authenticateRequest(request);

    if (!auth.ok) {
      return auth.response;
    }

    // Parse request body
    const updateData = await request.json();

    // Initialize Firestore
    const db = getAdminDb();
    const applicationDocRef = db.collection("applications").doc(applicationId);

    // Check if application exists and get its data
    const applicationDoc = await applicationDocRef.get();
    if (!applicationDoc.exists) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const applicationData = applicationDoc.data();

    // Users can only update their own applications
    if (!applicationData || applicationData.userId !== auth.token.uid) {
      throw createAuthorizationError("Access denied. You can only update your own applications.", 'INSUFFICIENT_PERMISSIONS');
    }

    // Prepare update data with timestamp
    const updatePayload = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    // Update application in Firestore
    await applicationDocRef.update(updatePayload);

    // Return updated application data
    const updatedDoc = await applicationDocRef.get();
    const updatedData = updatedDoc.data();

    return NextResponse.json({
      id: applicationId,
      message: 'Application updated successfully',
      application: updatedData
    });

  }, {
    endpoint: '/api/app/applications/[applicationId]',
    method: 'PUT',
    requestId,
    userId: undefined // Will be set by error handling
  });

  return applyCorsHeaders(response, request);
}

// GET /api/app/applications/[applicationId] - Get a specific application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const requestId = generateRequestId();
  const { applicationId } = await params;

  const response = await withErrorHandling(async () => {
    const auth = await authenticateRequest(request);

    if (!auth.ok) {
      return auth.response;
    }

    // Initialize Firestore
    const db = getAdminDb();
    const applicationDoc = await db.collection("applications").doc(applicationId).get();

    if (!applicationDoc.exists) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const applicationData = applicationDoc.data();

    // Users can only access their own applications
    if (!applicationData || (applicationData.userId !== auth.token.uid && !auth.isAdmin)) {
      throw createAuthorizationError("Access denied. You can only access your own applications.", 'INSUFFICIENT_PERMISSIONS');
    }

    // Return application data
    return NextResponse.json({
      id: applicationId,
      application: applicationData
    });

  }, {
    endpoint: '/api/app/applications/[applicationId]',
    method: 'GET',
    requestId,
    userId: undefined // Will be set by error handling
  });

  return applyCorsHeaders(response, request);
}

// DELETE /api/app/applications/[applicationId] - Delete an application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const requestId = generateRequestId();
  const { applicationId } = await params;

  const response = await withErrorHandling(async () => {
    const auth = await authenticateRequest(request);

    if (!auth.ok) {
      return auth.response;
    }

    // Initialize Firestore
    const db = getAdminDb();
    const applicationDoc = await db.collection("applications").doc(applicationId).get();

    if (!applicationDoc.exists) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const applicationData = applicationDoc.data();

    // Users can only delete their own applications
    if (!applicationData || (applicationData.userId !== auth.token.uid && !auth.isAdmin)) {
      throw createAuthorizationError("Access denied. You can only delete your own applications.", 'INSUFFICIENT_PERMISSIONS');
    }

    // Delete application from Firestore
    await db.collection("applications").doc(applicationId).delete();

    return NextResponse.json({
      message: 'Application deleted successfully'
    });

  }, {
    endpoint: '/api/app/applications/[applicationId]',
    method: 'DELETE',
    requestId,
    userId: undefined // Will be set by error handling
  });

  return applyCorsHeaders(response, request);
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request);
}
