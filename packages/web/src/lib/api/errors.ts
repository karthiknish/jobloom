// lib/api/errors.ts - Comprehensive API error handling system

// Enhanced error classes for different types of errors
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public operation: string,
    public code?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Error response interface
export interface ErrorResponse {
  error: string;
  code: string;
  field?: string;
  operation?: string;
  retryAfter?: number;
  timestamp: number;
  requestId?: string;
  details?: Record<string, any>;
}

// Error logging utilities
export class ErrorLogger {
  static log(error: unknown, context?: {
    endpoint?: string;
    method?: string;
    userId?: string;
    requestId?: string;
    body?: any;
  }) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        field: (error as any).field,
        operation: (error as any).operation
      } : String(error),
      context
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 API Error:', JSON.stringify(logEntry, null, 2));
    }

    // TODO: In production, send to monitoring service
    // await sendToMonitoringService(logEntry);
  }

  static logValidationError(error: ValidationError, context?: any) {
    this.log(error, { ...context, errorType: 'validation' });
  }

  static logAuthError(error: AuthorizationError, context?: any) {
    this.log(error, { ...context, errorType: 'authorization' });
  }

  static logDatabaseError(error: DatabaseError, context?: any) {
    this.log(error, { ...context, errorType: 'database' });
  }

  static logRateLimitError(error: RateLimitError, context?: any) {
    this.log(error, { ...context, errorType: 'rate_limit' });
  }

  static logNetworkError(error: NetworkError, context?: any) {
    this.log(error, { ...context, errorType: 'network' });
  }
}

// Main error handling function
export function handleApiError(error: unknown, context?: {
  endpoint?: string;
  method?: string;
  userId?: string;
  requestId?: string;
}): Response {
  // Generate request ID if not provided
  const requestId = context?.requestId || generateRequestId();

  // Log the error
  ErrorLogger.log(error, { ...context, requestId });

  // Handle specific error types
  if (error instanceof ValidationError) {
    const response: ErrorResponse = {
      error: error.message,
      code: error.code || 'VALIDATION_ERROR',
      field: error.field,
      timestamp: Date.now(),
      requestId
    };

    return new Response(JSON.stringify(response), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      }
    });
  }

  if (error instanceof AuthorizationError) {
    const response: ErrorResponse = {
      error: error.message,
      code: error.code || 'AUTHORIZATION_ERROR',
      timestamp: Date.now(),
      requestId
    };

    return new Response(JSON.stringify(response), {
      status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      }
    });
  }

  if (error instanceof DatabaseError) {
    const response: ErrorResponse = {
      error: error.message,
      code: error.code || 'DATABASE_ERROR',
      operation: error.operation,
      timestamp: Date.now(),
      requestId
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      }
    });
  }

  if (error instanceof RateLimitError) {
    const response: ErrorResponse = {
      error: error.message,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: error.retryAfter,
      timestamp: Date.now(),
      requestId
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId
    };

    if (error.retryAfter) {
      headers['Retry-After'] = error.retryAfter.toString();
    }

    return new Response(JSON.stringify(response), {
      status: 429,
      headers
    });
  }

  if (error instanceof NetworkError) {
    const response: ErrorResponse = {
      error: error.message,
      code: 'NETWORK_ERROR',
      timestamp: Date.now(),
      requestId
    };

    return new Response(JSON.stringify(response), {
      status: error.statusCode || 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      }
    });
  }

  // Handle Firebase specific errors
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as { code: string; message: string };

    switch (firebaseError.code) {
      case 'permission-denied':
        return new Response(JSON.stringify({
          error: 'Permission denied. You do not have access to this resource.',
          code: 'PERMISSION_DENIED',
          timestamp: Date.now(),
          requestId
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          }
        });

      case 'unauthenticated':
        return new Response(JSON.stringify({
          error: 'Authentication required. Please sign in to access this resource.',
          code: 'UNAUTHENTICATED',
          timestamp: Date.now(),
          requestId
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          }
        });

      case 'unavailable':
        return new Response(JSON.stringify({
          error: 'Service temporarily unavailable. Please try again later.',
          code: 'SERVICE_UNAVAILABLE',
          timestamp: Date.now(),
          requestId
        }), {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          }
        });

      case 'deadline-exceeded':
        return new Response(JSON.stringify({
          error: 'Request timeout. Please try again.',
          code: 'TIMEOUT_ERROR',
          timestamp: Date.now(),
          requestId
        }), {
          status: 504,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          }
        });

      case 'not-found':
        return new Response(JSON.stringify({
          error: 'The requested resource was not found.',
          code: 'NOT_FOUND',
          timestamp: Date.now(),
          requestId
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          }
        });

      case 'already-exists':
        return new Response(JSON.stringify({
          error: 'The resource already exists.',
          code: 'ALREADY_EXISTS',
          timestamp: Date.now(),
          requestId
        }), {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          }
        });

      case 'invalid-argument':
        return new Response(JSON.stringify({
          error: 'Invalid arguments provided.',
          code: 'INVALID_ARGUMENT',
          timestamp: Date.now(),
          requestId
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          }
        });

      case 'resource-exhausted':
        return new Response(JSON.stringify({
          error: 'Resource limit exceeded. Please try again later.',
          code: 'RESOURCE_EXHAUSTED',
          timestamp: Date.now(),
          requestId
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          }
        });

      default:
        return new Response(JSON.stringify({
          error: 'The service encountered an unexpected issue. Please try again shortly.',
          code: 'FIREBASE_ERROR',
          details: { firebaseCode: firebaseError.code },
          timestamp: Date.now(),
          requestId
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          }
        });
    }
  }

  // Handle generic errors
  const response: ErrorResponse = {
    error: 'An unexpected error occurred. Please try again.',
    code: 'INTERNAL_ERROR',
    timestamp: Date.now(),
    requestId
  };

  // Include error details in development
  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    response.details = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return new Response(JSON.stringify(response), {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId
    }
  });
}

// Utility functions for error handling
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createValidationError(message: string, field?: string): ValidationError {
  return new ValidationError(message, field, 'VALIDATION_ERROR');
}

export function createAuthorizationError(message: string, code?: string): AuthorizationError {
  return new AuthorizationError(message, code || 'UNAUTHORIZED');
}

export function createDatabaseError(message: string, operation: string): DatabaseError {
  return new DatabaseError(message, operation, 'DATABASE_ERROR');
}

export function createRateLimitError(message: string, retryAfter?: number): RateLimitError {
  return new RateLimitError(message, retryAfter);
}

export function createNetworkError(message: string, statusCode?: number): NetworkError {
  return new NetworkError(message, statusCode);
}

// Validation utilities
export function validateRequiredFields(data: any, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !data[field]);
  if (missingFields.length > 0) {
    throw createValidationError(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

export function validateEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw createValidationError('Email is required', 'email');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createValidationError('Invalid email format', 'email');
  }
}

export function validateUrl(url: string, fieldName: string = 'url'): void {
  if (!url || typeof url !== 'string') {
    throw createValidationError(`${fieldName} is required`, fieldName);
  }
  try {
    new URL(url);
  } catch {
    throw createValidationError(`Invalid ${fieldName} format`, fieldName);
  }
}

export function validateId(id: string, fieldName: string = 'id'): void {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw createValidationError(`${fieldName} is required`, fieldName);
  }
}

export function validateArray(field: any, fieldName: string, required: boolean = true): void {
  if (required && (!field || !Array.isArray(field))) {
    throw createValidationError(`${fieldName} must be an array`, fieldName);
  }
  if (field && !Array.isArray(field)) {
    throw createValidationError(`${fieldName} must be an array`, fieldName);
  }
}

export function validateString(field: any, fieldName: string, required: boolean = true, minLength?: number, maxLength?: number): void {
  if (required && (!field || typeof field !== 'string')) {
    throw createValidationError(`${fieldName} is required`, fieldName);
  }
  if (field && typeof field !== 'string') {
    throw createValidationError(`${fieldName} must be a string`, fieldName);
  }
  if (field && minLength !== undefined && field.length < minLength) {
    throw createValidationError(`${fieldName} must be at least ${minLength} characters long`, fieldName);
  }
  if (field && maxLength !== undefined && field.length > maxLength) {
    throw createValidationError(`${fieldName} must not exceed ${maxLength} characters`, fieldName);
  }
}

export function validateBoolean(field: any, fieldName: string, required: boolean = false): void {
  if (required && field === undefined) {
    throw createValidationError(`${fieldName} is required`, fieldName);
  }
  if (field !== undefined && typeof field !== 'boolean') {
    throw createValidationError(`${fieldName} must be a boolean`, fieldName);
  }
}

export function validateNumber(field: any, fieldName: string, required: boolean = false, min?: number, max?: number): void {
  if (required && field === undefined) {
    throw createValidationError(`${fieldName} is required`, fieldName);
  }
  if (field !== undefined && (typeof field !== 'number' || isNaN(field))) {
    throw createValidationError(`${fieldName} must be a number`, fieldName);
  }
  if (field !== undefined && min !== undefined && field < min) {
    throw createValidationError(`${fieldName} must be at least ${min}`, fieldName);
  }
  if (field !== undefined && max !== undefined && field > max) {
    throw createValidationError(`${fieldName} must not exceed ${max}`, fieldName);
  }
}

// Request validation utilities
export async function validateRequestBody(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch (error) {
    throw createValidationError('Invalid JSON in request body');
  }
}

export function validateAuthHeader(request: Request): string {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw createAuthorizationError("Missing or invalid authorization header", 'MISSING_AUTH_HEADER');
  }
  return authHeader.substring(7);
}

export function validateContentType(request: Request, allowedTypes: string[] = ['application/json']): void {
  const contentType = request.headers.get('content-type');
  if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
    throw createValidationError(`Invalid content type. Expected: ${allowedTypes.join(', ')}`);
  }
}

// Async error wrapper for API handlers
export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  context?: {
    endpoint?: string;
    method?: string;
    userId?: string;
    requestId?: string;
  }
): Promise<Response> {
  try {
    const result = await handler();
    return result as Response;
  } catch (error) {
    return handleApiError(error, context);
  }
}