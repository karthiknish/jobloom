import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/lib/api/withAuth";
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
  // Enhanced error logging
  if (error instanceof Error) {
    console.error('API Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error as any).code && { code: (error as any).code }
    });
  } else {
    console.error('API Error:', error);
  }

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
export const GET = withAuth<{ jobId: string }>(
  async (request, { user, token }, params) => {
    try {
      const jobId = params?.jobId;
      
      if (!jobId) {
        throw new ValidationError('Job ID is required', 'jobId');
      }
      
      // Validate job ID
      validateJobId(jobId);

      // Check if mock token for development
      const isMockToken = process.env.NODE_ENV === "development" && 
        token.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

      if (isMockToken) {
        // Return mock job data for testing
        return NextResponse.json({ 
          job: {
            _id: jobId,
            title: "Mock Job Title",
            company: "Mock Company",
            location: "Mock Location",
            url: "https://example.com/mock-job",
            userId: user.uid
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
);

// PUT /api/app/jobs/[jobId] - Update a job
export const PUT = withAuth<{ jobId: string }>(
  async (request, { user, token }, params) => {
    try {
      const jobId = params?.jobId;
      
      if (!jobId) {
        throw new ValidationError('Job ID is required', 'jobId');
      }
      
      // Validate job ID
      validateJobId(jobId);

      // Check if mock token for development
      const isMockToken = process.env.NODE_ENV === "development" && 
        token.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

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
      if (existingJob.userId !== user.uid) {
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
);

// DELETE /api/app/jobs/[jobId] - Delete a job
export const DELETE = withAuth<{ jobId: string }>(
  async (request, { user, token }, params) => {
    try {
      const jobId = params?.jobId;
      
      if (!jobId) {
        throw new ValidationError('Job ID is required', 'jobId');
      }
      
      // Validate job ID
      validateJobId(jobId);

      // Check if mock token for development
      const isMockToken = process.env.NODE_ENV === "development" && 
        token.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

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
      if (existingJob.userId !== user.uid) {
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
);