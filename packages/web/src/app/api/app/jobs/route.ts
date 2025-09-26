import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { createFirestoreCollection } from "@/firebase/firestore";
import { getFirestore } from "firebase-admin/firestore";

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
function validateRequiredFields(data: any, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !data[field]);
  if (missingFields.length > 0) {
    throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

function validateJobData(jobData: any): void {
  // Validate string fields
  const stringFields = ['title', 'company', 'location', 'url'];
  for (const field of stringFields) {
    if (typeof jobData[field] !== 'string' || jobData[field].trim().length === 0) {
      throw new ValidationError(`${field} must be a non-empty string`, field);
    }
  }

  // Validate URL format
  try {
    new URL(jobData.url);
  } catch {
    throw new ValidationError('Invalid URL format', 'url');
  }

  // Validate arrays
  const arrayFields = ['skills', 'requirements', 'benefits'];
  for (const field of arrayFields) {
    if (jobData[field] && !Array.isArray(jobData[field])) {
      throw new ValidationError(`${field} must be an array`, field);
    }
  }

  // Validate boolean fields
  const booleanFields = ['remoteWork', 'isSponsored', 'isRecruitmentAgency'];
  for (const field of booleanFields) {
    if (jobData[field] !== undefined && typeof jobData[field] !== 'boolean') {
      throw new ValidationError(`${field} must be a boolean`, field);
    }
  }

  // Validate salary range if provided
  if (jobData.salaryRange) {
    if (typeof jobData.salaryRange !== 'object' || 
        (jobData.salaryRange.min && typeof jobData.salaryRange.min !== 'number') ||
        (jobData.salaryRange.max && typeof jobData.salaryRange.max !== 'number')) {
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

// POST /api/app/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    // Validate authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthorizationError("Missing or invalid authorization header");
    }

    // Verify token
    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      throw new AuthorizationError("Invalid authentication token");
    }

    // Parse and validate request body
    let jobData;
    try {
      jobData = await request.json();
    } catch (parseError) {
      throw new ValidationError("Invalid JSON in request body");
    }

    // Validate required fields
    validateRequiredFields(jobData, ['title', 'company', 'location', 'url', 'userId']);

    // Validate job data structure
    validateJobData(jobData);

    // Verify userId matches token
    if (jobData.userId !== decodedToken.uid) {
      throw new AuthorizationError("User ID does not match authentication token");
    }

    // Initialize Firestore
    const jobsCollection = createFirestoreCollection<any>('jobs');

    // Create job object with comprehensive LinkedIn data
    const jobDataToCreate = {
      title: jobData.title.trim(),
      company: jobData.company.trim(),
      location: jobData.location.trim(),
      url: jobData.url.trim(),
      description: jobData.description?.trim() || '',
      salary: jobData.salary?.trim() || '',
      salaryRange: jobData.salaryRange || null,
      skills: Array.isArray(jobData.skills) ? jobData.skills : [],
      requirements: Array.isArray(jobData.requirements) ? jobData.requirements : [],
      benefits: Array.isArray(jobData.benefits) ? jobData.benefits : [],
      jobType: jobData.jobType?.trim() || '',
      experienceLevel: jobData.experienceLevel?.trim() || '',
      remoteWork: Boolean(jobData.remoteWork),
      companySize: jobData.companySize?.trim() || '',
      industry: jobData.industry?.trim() || '',
      postedDate: jobData.postedDate?.trim() || '',
      applicationDeadline: jobData.applicationDeadline?.trim() || '',
      isSponsored: Boolean(jobData.isSponsored),
      isRecruitmentAgency: Boolean(jobData.isRecruitmentAgency),
      sponsorshipType: jobData.sponsorshipType?.trim() || '',
      source: jobData.source?.trim() || 'extension',
      userId: jobData.userId,
    };

    // Create job in Firestore
    const createdJob = await jobsCollection.create(jobDataToCreate);

    return NextResponse.json({ 
      id: createdJob._id,
      message: 'Job created successfully'
    });

  } catch (error) {
    return handleError(error);
  }
}

// GET /api/app/jobs - Get all jobs (admin only)
export async function GET(request: NextRequest) {
  try {
    // Validate authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthorizationError("Missing or invalid authorization header");
    }

    // Verify token
    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      throw new AuthorizationError("Invalid authentication token");
    }

    // Initialize Firestore
    const jobsCollection = createFirestoreCollection<any>('jobs');

    // Get all jobs (admin only)
    const jobs = await jobsCollection.getAll();

    return NextResponse.json({ 
      jobs,
      count: jobs.length,
      message: 'Jobs retrieved successfully'
    });

  } catch (error) {
    return handleError(error);
  }
}