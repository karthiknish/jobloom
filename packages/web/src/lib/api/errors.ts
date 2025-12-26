/**
 * API Error Handling - Unified Error Module
 * 
 * This file consolidates error handling by re-exporting from errorResponse.ts
 * and providing additional validation utilities.
 * 
 * For error classes and response utilities, import from this file OR errorResponse.ts
 */

// Re-export all error classes and utilities from errorResponse.ts
export {
  ValidationError,
  AuthorizationError,
  DatabaseError,
  RateLimitError,
  NetworkError,
  NotFoundError,
  ConflictError,
  ServiceUnavailableError,
  ErrorLogger,
  type LogContext,
  type ApiErrorOptions,
  type ApiErrorResponse,
  createErrorResponse,
  createValidationError as createValidationErrorResponse,
  createAuthError,
  createNotFoundError,
  createRateLimitError as createRateLimitErrorResponse,
  createInternalError,
  handleExternalServiceError,
  createDatabaseErrorResponse,
  handleFileUploadError,
  withErrorHandler,
  handleDatabaseError,
  createSuccessResponse,
} from './errorResponse';

// Re-export error codes
export { ERROR_CODES, ERROR_STATUS_MAP, ERROR_MESSAGES } from './errorCodes';

// ============================================================================
// ERROR RESPONSE INTERFACE (for backward compatibility)
// ============================================================================

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

// ============================================================================
// UTILITY FUNCTIONS FOR CREATING ERROR INSTANCES
// ============================================================================

import { ValidationError, AuthorizationError, DatabaseError, RateLimitError, NetworkError } from './errorResponse';

/** Create a validation error instance */
export function createValidationError(message: string, field?: string): ValidationError {
  return new ValidationError(message, field, 'VALIDATION_ERROR');
}

/** Create an authorization error instance */
export function createAuthorizationError(message: string, code?: string): AuthorizationError {
  return new AuthorizationError(message, code || 'UNAUTHORIZED');
}

/** Create a database error instance */
export function createDatabaseError(message: string, operation: string): DatabaseError {
  return new DatabaseError(message, operation, 'DATABASE_ERROR');
}

/** Create a rate limit error instance */
export function createRateLimitError(message: string, retryAfter?: number): RateLimitError {
  return new RateLimitError(message, retryAfter);
}

/** Create a network error instance */
export function createNetworkError(message: string, statusCode?: number): NetworkError {
  return new NetworkError(message, statusCode);
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/** Validate required fields are present */
export function validateRequiredFields(data: any, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !data[field]);
  if (missingFields.length > 0) {
    throw createValidationError(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

/** Validate email format */
export function validateEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw createValidationError('Email is required', 'email');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createValidationError('Invalid email format', 'email');
  }
}

/** Validate URL format */
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

/** Validate ID is present and valid */
export function validateId(id: string, fieldName: string = 'id'): void {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw createValidationError(`${fieldName} is required`, fieldName);
  }
}

/** Validate array field */
export function validateArray(field: any, fieldName: string, required: boolean = true): void {
  if (required && (!field || !Array.isArray(field))) {
    throw createValidationError(`${fieldName} must be an array`, fieldName);
  }
  if (field && !Array.isArray(field)) {
    throw createValidationError(`${fieldName} must be an array`, fieldName);
  }
}

/** Validate string field with optional length constraints */
export function validateString(
  field: any, 
  fieldName: string, 
  required: boolean = true, 
  minLength?: number, 
  maxLength?: number
): void {
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

/** Validate boolean field */
export function validateBoolean(field: any, fieldName: string, required: boolean = false): void {
  if (required && field === undefined) {
    throw createValidationError(`${fieldName} is required`, fieldName);
  }
  if (field !== undefined && typeof field !== 'boolean') {
    throw createValidationError(`${fieldName} must be a boolean`, fieldName);
  }
}

/** Validate number field with optional range constraints */
export function validateNumber(
  field: any, 
  fieldName: string, 
  required: boolean = false, 
  min?: number, 
  max?: number
): void {
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

// ============================================================================
// REQUEST VALIDATION UTILITIES
// ============================================================================

/** Parse and validate JSON request body */
export async function validateRequestBody(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch (error) {
    throw createValidationError('Invalid JSON in request body');
  }
}

/** Validate authorization header and extract token */
export function validateAuthHeader(request: Request): string {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw createAuthorizationError("Missing or invalid authorization header", 'MISSING_AUTH_HEADER');
  }
  return authHeader.substring(7);
}

/** Validate content type header */
export function validateContentType(
  request: Request, 
  allowedTypes: string[] = ['application/json']
): void {
  const contentType = request.headers.get('content-type');
  if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
    throw createValidationError(`Invalid content type. Expected: ${allowedTypes.join(', ')}`);
  }
}

// ============================================================================
// REQUEST ID UTILITY
// ============================================================================

/** Generate a unique request ID */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}