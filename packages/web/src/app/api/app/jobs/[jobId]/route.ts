import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { createFirestoreCollection } from "@/firebase/firestore";
import { getAdminFirestore } from "@/firebase/admin";

// Enhanced error types
class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

class DatabaseError extends Error {
  constructor(message: string, public operation: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Validation utilities
function validateJobId(jobId: string): void {
  if (!jobId || typeof jobId !== 'string' || jobId.trim().length === 0) {
    throw new ValidationError('Invalid job ID', 'jobId');
  }
}

function validateUpdateData(updateData: any): void {
  // Prevent updating critical fields
  const protectedFields = ['_id', 'createdAt', 'userId'];
  for (const field of protectedFields) {
    if (field in updateData) {
      throw new ValidationError(`Cannot update protected field: ${field}`, field);
    }
  }

  // Validate array fields
  const arrayFields = ['skills', 'requirements', 'benefits'];
  for (const field of arrayFields) {
    if (updateData[field] !== undefined && !Array.isArray(updateData[field])) {
      throw new ValidationError(`${field} must be an array`, field);
    }
  }

  // Validate boolean fields
  const booleanFields = ['remoteWork', 'isSponsored', 'isRecruitmentAgency'];
  for (const field of booleanFields) {
    if (updateData[field] !== undefined && typeof updateData[field] !== 'boolean') {
      throw new ValidationError(`${field} must be a boolean`, field);
    }
  }

  // Validate salary range if provided
  if (updateData.salaryRange) {
    if (typeof updateData.salaryRange !== 'object' || 
        (updateData.salaryRange.min && typeof updateData.salaryRange.min !== 'number') ||
        (updateData.salaryRange.max && typeof updateData.salaryRange.max !== 'number')) {
      throw new ValidationError('salaryRange must be an object with optional min/max numbers', 'salaryRange');
    }
  }
}

function handleError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ValidationError) {
    return NextResponse.json({ 
      error: error.message,
      field: error.field,
      code: 'VALIDATION_ERROR'
    }, { status: 400 });
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json({ 
      error: error.message,
      code: 'AUTHORIZATION_ERROR'
    }, { status: 401 });
  }

  if (error instanceof DatabaseError) {
    return NextResponse.json({ 
      error: error.message,
      operation: error.operation,
      code: 'DATABASE_ERROR'
    }, { status: 500 });
  }

  // Handle Firebase specific errors
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as { code: string; message: string };
    switch (firebaseError.code) {
      case 'permission-denied':
        return NextResponse.json({ 
          error: 'Permission denied. You do not have access to this resource.',
          code: 'PERMISSION_DENIED'
        }, { status: 403 });
      case 'not-found':
        return NextResponse.json({ 
          error: 'Job not found.',
          code: 'NOT_FOUND'
        }, { status: 404 });
      case 'unavailable':
        return NextResponse.json({ 
          error: 'Service temporarily unavailable. Please try again later.',
          code: 'SERVICE_UNAVAILABLE'
        }, { status: 503 });
      case 'deadline-exceeded':
        return NextResponse.json({ 
          error: 'Request timeout. Please try again.',
          code: 'TIMEOUT_ERROR'
        }, { status: 504 });
    }
  }

  // Generic error
  return NextResponse.json({ 
    error: 'An unexpected error occurred. Please try again.',
    code: 'INTERNAL_ERROR'
  }, { status: 500 });
}

// GET /api/app/jobs/[jobId] - Get a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    // Validate job ID
    validateJobId(jobId);

    // Validate authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthorizationError("Missing or invalid authorization header");
    }

    // Verify token
    const token = authHeader.substring(7);

    // In development with mock tokens, skip Firebase operations for testing
    const isMockToken = process.env.NODE_ENV === "development" && 
      token.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    let decodedToken;
    if (isMockToken) {
      decodedToken = {
        uid: "test-user-123",
        email: "test@example.com",
        email_verified: true
      };
    } else {
      decodedToken = await verifyIdToken(token);
    }

    if (!decodedToken) {
      throw new AuthorizationError("Invalid authentication token");
    }

    if (isMockToken) {
      // Return mock job data for testing
      return NextResponse.json({ 
        job: {
          _id: jobId,
          title: "Mock Job Title",
          company: "Mock Company",
          location: "Mock Location",
          url: "https://example.com/mock-job",
          userId: decodedToken.uid
        },
        message: 'Job retrieved successfully (mock)'
      });
    }

    // Initialize Firestore
    const jobsCollection = createFirestoreCollection<any>('jobs');

    // Get specific job
    const job = await jobsCollection.get(jobId);
    
    if (!job) {
      throw new DatabaseError('Job not found', 'get');
    }

    return NextResponse.json({ 
      job,
      message: 'Job retrieved successfully'
    });

  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/app/jobs/[jobId] - Update a job
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    // Validate job ID
    validateJobId(jobId);

    // Validate authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthorizationError("Missing or invalid authorization header");
    }

    // Verify token
    const token = authHeader.substring(7);

    // In development with mock tokens, skip Firebase operations for testing
    const isMockToken = process.env.NODE_ENV === "development" && 
      token.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    let decodedToken;
    if (isMockToken) {
      decodedToken = {
        uid: "test-user-123",
        email: "test@example.com",
        email_verified: true
      };
    } else {
      decodedToken = await verifyIdToken(token);
    }

    if (!decodedToken) {
      throw new AuthorizationError("Invalid authentication token");
    }

    // Parse and validate request body
    let updateData;
    try {
      updateData = await request.json();
    } catch (parseError) {
      throw new ValidationError("Invalid JSON in request body");
    }

    // Validate update data
    validateUpdateData(updateData);

    if (isMockToken) {
      // Return mock success response for testing
      return NextResponse.json({ 
        message: 'Job updated successfully (mock)'
      });
    }

    // Initialize Firestore
    const jobsCollection = createFirestoreCollection<any>('jobs');

    // First, check if job exists and user has permission
    const existingJob = await jobsCollection.get(jobId);
    if (!existingJob) {
      throw new DatabaseError('Job not found', 'get');
    }

    // Verify user owns the job
    if (existingJob.userId !== decodedToken.uid) {
      throw new AuthorizationError("You do not have permission to update this job");
    }

    // Update job
    await jobsCollection.update(jobId, updateData);

    return NextResponse.json({ 
      message: 'Job updated successfully'
    });

  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/app/jobs/[jobId] - Delete a job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    // Validate job ID
    validateJobId(jobId);

    // Validate authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthorizationError("Missing or invalid authorization header");
    }

    // Verify token
    const token = authHeader.substring(7);

    // In development with mock tokens, skip Firebase operations for testing
    const isMockToken = process.env.NODE_ENV === "development" && 
      token.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    let decodedToken;
    if (isMockToken) {
      decodedToken = {
        uid: "test-user-123",
        email: "test@example.com",
        email_verified: true
      };
    } else {
      decodedToken = await verifyIdToken(token);
    }

    if (!decodedToken) {
      throw new AuthorizationError("Invalid authentication token");
    }

    if (isMockToken) {
      // Return mock success response for testing
      return NextResponse.json({ 
        message: 'Job deleted successfully (mock)'
      });
    }

    // Initialize Firestore
    const jobsCollection = createFirestoreCollection<any>('jobs');

    // First, check if job exists and user has permission
    const existingJob = await jobsCollection.get(jobId);
    if (!existingJob) {
      throw new DatabaseError('Job not found', 'get');
    }

    // Verify user owns the job
    if (existingJob.userId !== decodedToken.uid) {
      throw new AuthorizationError("You do not have permission to delete this job");
    }

    // Delete job
    await jobsCollection.delete(jobId);

    return NextResponse.json({ 
      message: 'Job deleted successfully'
    });

  } catch (error) {
    return handleError(error);
  }
}