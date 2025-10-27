/**
 * Enhanced API Error Response Utilities
 * Standardized error responses with proper codes, messages, and metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { ERROR_CODES, ERROR_STATUS_MAP, ERROR_MESSAGES } from './errorCodes';

export interface ApiErrorOptions {
  code?: string;
  message?: string;
  details?: Record<string, any>;
  field?: string;
  retryAfter?: number;
  requestId?: string;
  headers?: Record<string, string>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    field?: string;
    retryAfter?: number;
    timestamp: number;
    requestId: string;
    path?: string;
    method?: string;
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  options: ApiErrorOptions,
  request?: NextRequest,
  statusCode?: number
): NextResponse {
  const {
    code = ERROR_CODES.INTERNAL_SERVER_ERROR,
    message = ERROR_MESSAGES[code] || 'An error occurred',
    details,
    field,
    retryAfter,
    requestId = generateRequestId(),
    headers
  } = options;

  // Determine status code
  const status = statusCode || ERROR_STATUS_MAP[code] || 500;

  // Create error response body
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      field,
      retryAfter,
      timestamp: Date.now(),
      requestId,
      path: request?.url ? new URL(request.url).pathname : undefined,
      method: request?.method
    }
  };

  // Create NextResponse with headers
  const response = NextResponse.json(errorResponse, { status });

  // Add standard headers
  response.headers.set('X-Request-ID', requestId);
  response.headers.set('Content-Type', 'application/json');
  
  // Add custom headers
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  // Add retry header if specified
  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString());
  }

  return response;
}

/**
 * Create validation error response
 */
export function createValidationError(
  message: string,
  field?: string,
  details?: Record<string, any>
): NextResponse {
  return createErrorResponse({
    code: ERROR_CODES.VALIDATION_FAILED,
    message,
    field,
    details
  });
}

/**
 * Create authentication error response
 */
export function createAuthError(
  message?: string,
  code: string = ERROR_CODES.UNAUTHORIZED
): NextResponse {
  return createErrorResponse({
    code,
    message: message || ERROR_MESSAGES[code] || 'Authentication failed'
  });
}

/**
 * Create not found error response
 */
export function createNotFoundError(
  resource: string = 'Resource'
): NextResponse {
  return createErrorResponse({
    code: ERROR_CODES.CONTENT_NOT_FOUND,
    message: `${resource} not found`
  });
}

/**
 * Create rate limit error response
 */
export function createRateLimitError(
  retryAfter: number,
  message?: string
): NextResponse {
  return createErrorResponse({
    code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    message: message || 'Rate limit exceeded',
    retryAfter
  });
}

/**
 * Create internal server error response
 */
export function createInternalError(
  message?: string,
  details?: Record<string, any>
): NextResponse {
  return createErrorResponse({
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: message || 'Internal server error',
    details
  });
}

/**
 * Handle and format errors from external services
 */
export function handleExternalServiceError(
  serviceName: string,
  error: any,
  details?: Record<string, any>
): NextResponse {
  console.error(`External service error - ${serviceName}:`, error);
  
  const code = error?.code || ERROR_CODES.THIRD_PARTY_API_ERROR;
  const message = error?.message || `${serviceName} service error`;
  
  return createErrorResponse({
    code,
    message,
    details: {
      service: serviceName,
      originalError: error?.message,
      ...details
    }
  });
}

/**
 * Handle database errors
 */
export function createDatabaseErrorResponse(
  operation: string,
  error: any,
  details?: Record<string, any>
): NextResponse {
  console.error(`Database error during ${operation}:`, error);
  
  let code: string = ERROR_CODES.DATABASE_QUERY_FAILED;
  let message = `Database operation failed: ${operation}`;
  
  // Handle specific Firebase errors
  if (error?.code) {
    switch (error.code) {
      case 'not-found':
        code = ERROR_CODES.CONTENT_NOT_FOUND;
        message = 'Document not found';
        break;
      case 'permission-denied':
        code = ERROR_CODES.FORBIDDEN;
        message = 'Permission denied';
        break;
      case 'already-exists':
        code = ERROR_CODES.DUPLICATE_RECORD;
        message = 'Record already exists';
        break;
      case 'resource-exhausted':
        code = ERROR_CODES.QUOTA_EXCEEDED;
        message = 'Resource quota exceeded';
        break;
      case 'unavailable':
        code = ERROR_CODES.SERVICE_UNAVAILABLE;
        message = 'Database service unavailable';
        break;
      case 'deadline-exceeded':
        code = ERROR_CODES.TIMEOUT;
        message = 'Database operation timed out';
        break;
    }
  }
  
  return createErrorResponse({
    code,
    message,
    details: {
      operation,
      originalError: error?.message,
      errorCode: error?.code,
      ...details
    }
  });
}

/**
 * Handle file upload errors
 */
export function handleFileUploadError(
  error: any,
  details?: Record<string, any>
): NextResponse {
  console.error('File upload error:', error);
  
  let code: string = ERROR_CODES.FILE_UPLOAD_FAILED;
  let message = 'File upload failed';
  
  if (error?.code === 'STORAGE_LIMIT_EXCEEDED') {
    code = ERROR_CODES.QUOTA_EXCEEDED;
    message = 'Storage quota exceeded';
  } else if (error?.code === 'INVALID_FILE_TYPE') {
    code = ERROR_CODES.INVALID_FILE_TYPE;
    message = 'Invalid file type';
  } else if (error?.code === 'FILE_TOO_LARGE') {
    code = ERROR_CODES.FILE_TOO_LARGE;
    message = 'File too large';
  }
  
  return createErrorResponse({
    code,
    message,
    details: {
      originalError: error?.message,
      ...details
    }
  });
}

/**
 * Wrap async route handlers with standardized error handling
 */
export function withErrorHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('Unhandled API error:', error);
      
      // Handle known error types
      if (error instanceof Error) {
        // Check for specific error types and codes
        if (error.message.includes('Authentication')) {
          return createAuthError(error.message);
        }
        
        if (error.message.includes('Validation')) {
          return createValidationError(error.message);
        }
        
        if (error.message.includes('not found')) {
          return createNotFoundError();
        }
        
        // Handle Firebase errors
        if ((error as any)?.code?.startsWith('auth/')) {
          return createAuthError(error.message, ERROR_CODES.INVALID_TOKEN);
        }
        
        if ((error as any)?.code?.startsWith('storage/')) {
          return handleFileUploadError(error);
        }
        
        if ((error as any)?.code?.startsWith('firestore/')) {
          return handleDatabaseError('unknown', error);
        }
      }
      
      // Default internal server error
      return createInternalError(
        process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : 'An unexpected error occurred'
      );
    }
  };
}

/**
 * Handle database errors (alias for createDatabaseErrorResponse)
 */
export function handleDatabaseError(
  operation: string,
  error: any,
  details?: Record<string, any>
): NextResponse {
  return createDatabaseErrorResponse(operation, error, details);
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Success response wrapper for consistency
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, any>
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
    meta,
    timestamp: Date.now()
  });
}
