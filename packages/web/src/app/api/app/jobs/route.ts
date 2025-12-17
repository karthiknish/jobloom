import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { applyCorsHeaders, preflightResponse } from "@/lib/api/cors";
import { authenticateRequest } from "@/lib/api/auth";
import { FieldValue } from "firebase-admin/firestore";
import { normalizeJobUrl, extractJobIdentifier } from "@/lib/utils/urlNormalizer";

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

// Retry utilities for database operations
const MAX_RETRIES = 2;
const INITIAL_DELAY_MS = 200;

async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      
      // Don't retry validation or auth errors
      if (error instanceof ValidationError || error instanceof AuthorizationError) {
        throw error;
      }
      
      // Check if it's a retryable Firebase error
      const isRetryable = error && typeof error === 'object' && 'code' in error &&
        ['unavailable', 'deadline-exceeded', 'resource-exhausted'].includes((error as { code: string }).code);
      
      if (!isRetryable || attempt === MAX_RETRIES) {
        console.error(`${operationName} failed after ${attempt} attempts:`, error);
        throw error;
      }
      
      // Exponential backoff
      const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(`${operationName} failed, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Check for duplicate jobs by URL (optimized with limit 1)
// Uses normalized URLs and job identifiers to detect duplicates even with different tracking params
async function checkDuplicateJob(
  db: ReturnType<typeof getAdminDb>,
  url: string,
  userId: string
): Promise<boolean> {
  try {
    const normalizedUrl = normalizeJobUrl(url);
    const jobIdentifier = extractJobIdentifier(url);
    
    // First, check by normalized URL
    const urlSnapshot = await db.collection('jobs')
      .where('userId', '==', userId)
      .where('normalizedUrl', '==', normalizedUrl)
      .limit(1)
      .get();
    
    if (!urlSnapshot.empty) {
      return true;
    }
    
    // If job identifier is different from normalized URL (e.g., "linkedin:12345"),
    // also check by job identifier for more reliable matching
    if (jobIdentifier !== normalizedUrl) {
      const idSnapshot = await db.collection('jobs')
        .where('userId', '==', userId)
        .where('jobIdentifier', '==', jobIdentifier)
        .limit(1)
        .get();
      
      if (!idSnapshot.empty) {
        return true;
      }
    }
    
    // Fallback: check exact URL match (for backwards compatibility)
    const exactSnapshot = await db.collection('jobs')
      .where('userId', '==', userId)
      .where('url', '==', url.trim())
      .limit(1)
      .get();
    
    return !exactSnapshot.empty;
  } catch (error) {
    // If query fails, assume no duplicate to not block job creation
    console.warn('Duplicate check failed:', error);
    return false;
  }
}

// POST /api/app/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    // Verify session
    const auth = await authenticateRequest(request);

    if (!auth.ok) {
      return applyCorsHeaders(auth.response, request);
    }

    // Parse and validate request body
    let jobData;
    try {
      jobData = await request.json();
    } catch (parseError) {
      throw new ValidationError("Invalid JSON in request body");
    }

    // In development with mock tokens, skip validation and Firebase operations for testing
    const isMockToken = process.env.NODE_ENV === "development" && 
      request.headers.get("authorization")?.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    if (isMockToken) {
      // Return mock success response for testing
      return applyCorsHeaders(
        NextResponse.json({ 
          id: `mock-job-${Date.now()}`,
          message: 'Job created successfully (mock)'
        }),
        request,
      );
    }

    // Validate required fields
    validateRequiredFields(jobData, ['title', 'company', 'location', 'url', 'userId']);

    // Validate job data structure
    validateJobData(jobData);

    // Verify userId matches token
    if (jobData.userId !== auth.token.uid) {
      throw new AuthorizationError("User ID does not match authentication token");
    }

    // Initialize Firestore Admin
    const db = getAdminDb();

    // Check for duplicate job (by URL)
    if (jobData.url) {
      const isDuplicate = await checkDuplicateJob(db, jobData.url, jobData.userId);
      if (isDuplicate) {
        return applyCorsHeaders(
          NextResponse.json({ 
            error: "A job with this URL already exists in your board",
            code: "DUPLICATE_JOB",
            field: "url"
          }, { status: 409 }),
          request,
        );
      }
    }

    // Create job object with comprehensive LinkedIn data
    const now = Date.now();
    const normalizedUrl = normalizeJobUrl(jobData.url);
    const jobIdentifier = extractJobIdentifier(jobData.url);
    
    const jobDataToCreate = {
      title: jobData.title.trim(),
      company: jobData.company.trim(),
      location: jobData.location.trim(),
      url: jobData.url.trim(),
      normalizedUrl,           // For duplicate detection
      jobIdentifier,           // For reliable job matching across URL variations
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
      dateFound: typeof jobData.dateFound === 'number' ? jobData.dateFound : now,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Create job in Firestore with retry
    const createdJob = await withRetry(
      async () => {
        const docRef = await db.collection('jobs').add(jobDataToCreate);
        return { _id: docRef.id };
      },
      'createJob'
    );

    return applyCorsHeaders(
      NextResponse.json({ 
        id: createdJob._id,
        message: 'Job created successfully'
      }),
      request,
    );

  } catch (error) {
    const errorResponse = handleError(error);
    // If handleError returns a Response, add CORS headers
    if (errorResponse instanceof NextResponse) {
      return applyCorsHeaders(errorResponse, request);
    }
    return errorResponse;
  }
}

// GET /api/app/jobs - Get all jobs (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify session
    const auth = await authenticateRequest(request, {
      loadUser: true,
    });

    if (!auth.ok) {
      return applyCorsHeaders(auth.response, request);
    }

    if (!auth.isAdmin) {
      throw new AuthorizationError("Admin access required");
    }

    // In development with mock tokens, skip Firebase operations for testing
    const isMockToken = process.env.NODE_ENV === "development" && 
      request.headers.get("authorization")?.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    if (isMockToken) {
      // Return mock success response for testing
      return applyCorsHeaders(
        NextResponse.json({ 
          jobs: [],
          count: 0,
          message: 'Jobs retrieved successfully (mock)'
        }),
        request,
      );
    }

    // Initialize Firestore Admin
    const db = getAdminDb();

    // Get all jobs (admin only)
    const snapshot = await db.collection('jobs').get();
    const jobs = snapshot.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));

    return applyCorsHeaders(
      NextResponse.json({ 
        jobs,
        count: jobs.length,
        message: 'Jobs retrieved successfully'
      }),
      request,
    );

  } catch (error) {
    const errorResponse = handleError(error);
    // If handleError returns a Response, add CORS headers
    if (errorResponse instanceof NextResponse) {
      return applyCorsHeaders(errorResponse, request);
    }
    return errorResponse;
  }
}


// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request);
}
