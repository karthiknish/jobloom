/**
 * API Validation Utilities
 * Common validation functions and schemas for API endpoints
 */

import { z, ZodSchema } from 'zod';
import { NextRequest } from 'next/server';
import { ERROR_CODES } from './errorCodes';
import { createValidationError } from './errorResponse';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

// ============================================================================
// Zod-based Query Parameter Validation
// ============================================================================

/**
 * Validate and parse query parameters using a Zod schema.
 * Returns typed, validated parameters or throws a validation error.
 * 
 * @example
 * const schema = z.object({
 *   page: z.coerce.number().int().min(1).default(1),
 *   limit: z.coerce.number().int().min(1).max(100).default(20),
 * });
 * const { page, limit } = validateQueryParams(request, schema);
 */
export function validateQueryParams<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): z.infer<T> {
  const url = new URL(request.url);
  const rawParams: Record<string, string | undefined> = {};
  
  // Convert URLSearchParams to a plain object
  url.searchParams.forEach((value, key) => {
    rawParams[key] = value;
  });

  const result = schema.safeParse(rawParams);

  if (!result.success) {
    const firstError = result.error.issues[0];
    throw createValidationError(
      firstError?.message || 'Invalid query parameters',
      firstError?.path.join('.') || 'query',
      { validationErrors: result.error.issues.map((e: z.ZodIssue) => ({
        field: e.path.join('.'),
        code: ERROR_CODES.VALIDATION_FAILED,
        message: e.message,
      }))}
    );
  }

  return result.data;
}

// ============================================================================
// Common Query Parameter Schemas (Reusable)
// ============================================================================

/**
 * Standard pagination schema with page/limit/offset
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Common search query parameters
 */
export const searchQuerySchema = z.object({
  q: z.string().max(200).optional(),
  search: z.string().max(200).optional(),
});

/**
 * Boolean query parameter (handles 'true'/'false' strings)
 */
export const booleanQueryParam = z.enum(['true', 'false']).transform(v => v === 'true').optional();

// ============================================================================
// Manual Validation Functions (Legacy - prefer Zod schemas above)
// ============================================================================

/**
 * Email validation
 */
export function validateEmail(email: string, field: string = 'email'): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!email) {
    errors.push({
      field,
      code: ERROR_CODES.MISSING_REQUIRED_FIELD,
      message: 'Email is required'
    });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({
      field,
      code: ERROR_CODES.INVALID_EMAIL,
      message: 'Invalid email format',
      value: email
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Password validation
 */
export function validatePassword(
  password: string, 
  field: string = 'password',
  options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  } = {}
): ValidationResult {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true
  } = options;
  
  const errors: ValidationError[] = [];
  
  if (!password) {
    errors.push({
      field,
      code: ERROR_CODES.MISSING_REQUIRED_FIELD,
      message: 'Password is required'
    });
  } else {
    if (password.length < minLength) {
      errors.push({
        field,
        code: ERROR_CODES.INVALID_PASSWORD,
        message: `Password must be at least ${minLength} characters long`
      });
    }
    
    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push({
        field,
        code: ERROR_CODES.INVALID_PASSWORD,
        message: 'Password must contain at least one uppercase letter'
      });
    }
    
    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push({
        field,
        code: ERROR_CODES.INVALID_PASSWORD,
        message: 'Password must contain at least one lowercase letter'
      });
    }
    
    if (requireNumbers && !/\d/.test(password)) {
      errors.push({
        field,
        code: ERROR_CODES.INVALID_PASSWORD,
        message: 'Password must contain at least one number'
      });
    }
    
    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push({
        field,
        code: ERROR_CODES.INVALID_PASSWORD,
        message: 'Password must contain at least one special character'
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * UUID validation
 */
export function validateUUID(uuid: string, field: string = 'id'): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!uuid) {
    errors.push({
      field,
      code: ERROR_CODES.MISSING_REQUIRED_FIELD,
      message: 'ID is required'
    });
  } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) {
    errors.push({
      field,
      code: ERROR_CODES.INVALID_UUID,
      message: 'Invalid UUID format',
      value: uuid
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Required field validation
 */
export function validateRequired(
  value: any, 
  field: string, 
  fieldName?: string
): ValidationResult {
  const errors: ValidationError[] = [];
  const displayName = fieldName || field;
  
  if (value === null || value === undefined || value === '') {
    errors.push({
      field,
      code: ERROR_CODES.MISSING_REQUIRED_FIELD,
      message: `${displayName} is required`
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * String length validation
 */
export function validateStringLength(
  value: string,
  field: string,
  options: {
    min?: number;
    max?: number;
    fieldName?: string;
  } = {}
): ValidationResult {
  const { min, max, fieldName } = options;
  const errors: ValidationError[] = [];
  const displayName = fieldName || field;
  
  if (typeof value !== 'string') {
    errors.push({
      field,
      code: ERROR_CODES.VALIDATION_FAILED,
      message: `${displayName} must be a string`
    });
  } else {
    if (min !== undefined && value.length < min) {
      errors.push({
        field,
        code: ERROR_CODES.VALIDATION_FAILED,
        message: `${displayName} must be at least ${min} characters long`
      });
    }
    
    if (max !== undefined && value.length > max) {
      errors.push({
        field,
        code: ERROR_CODES.VALIDATION_FAILED,
        message: `${displayName} must not exceed ${max} characters`
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Number validation
 */
export function validateNumber(
  value: any,
  field: string,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    fieldName?: string;
  } = {}
): ValidationResult {
  const { min, max, integer = false, fieldName } = options;
  const errors: ValidationError[] = [];
  const displayName = fieldName || field;
  
  if (value === null || value === undefined || value === '') {
    errors.push({
      field,
      code: ERROR_CODES.MISSING_REQUIRED_FIELD,
      message: `${displayName} is required`
    });
  } else {
    const num = Number(value);
    
    if (isNaN(num)) {
      errors.push({
        field,
        code: ERROR_CODES.INVALID_NUMBER,
        message: `${displayName} must be a valid number`,
        value
      });
    } else {
      if (integer && !Number.isInteger(num)) {
        errors.push({
          field,
          code: ERROR_CODES.INVALID_NUMBER,
          message: `${displayName} must be an integer`,
          value: num
        });
      }
      
      if (min !== undefined && num < min) {
        errors.push({
          field,
          code: ERROR_CODES.INVALID_NUMBER,
          message: `${displayName} must be at least ${min}`,
          value: num
        });
      }
      
      if (max !== undefined && num > max) {
        errors.push({
          field,
          code: ERROR_CODES.INVALID_NUMBER,
          message: `${displayName} must not exceed ${max}`,
          value: num
        });
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * File validation
 */
export function validateFile(
  file: File,
  options: {
    allowedTypes?: string[];
    maxSize?: number;
    required?: boolean;
    field?: string;
  } = {}
): ValidationResult {
  const {
    allowedTypes = [],
    maxSize = 5 * 1024 * 1024, // 5MB default
    required = true,
    field = 'file'
  } = options;
  
  const errors: ValidationError[] = [];
  
  if (!file) {
    if (required) {
      errors.push({
        field,
        code: ERROR_CODES.MISSING_REQUIRED_FIELD,
        message: 'File is required'
      });
    }
  } else {
    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      errors.push({
        field,
        code: ERROR_CODES.INVALID_FILE_TYPE,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        value: file.type
      });
    }
    
    // Check file size
    if (file.size > maxSize) {
      errors.push({
        field,
        code: ERROR_CODES.FILE_TOO_LARGE,
        message: `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`,
        value: file.size
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * URL validation
 */
export function validateUrl(url: string, field: string = 'url'): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!url) {
    errors.push({
      field,
      code: ERROR_CODES.MISSING_REQUIRED_FIELD,
      message: 'URL is required'
    });
  } else {
    try {
      new URL(url);
    } catch {
      errors.push({
        field,
        code: ERROR_CODES.INVALID_URL,
        message: 'Invalid URL format',
        value: url
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Date validation
 */
export function validateDate(
  date: string | Date,
  field: string = 'date',
  options: {
    fieldName?: string;
    minDate?: Date;
    maxDate?: Date;
  } = {}
): ValidationResult {
  const { fieldName, minDate, maxDate } = options;
  const errors: ValidationError[] = [];
  const displayName = fieldName || field;
  
  if (!date) {
    errors.push({
      field,
      code: ERROR_CODES.MISSING_REQUIRED_FIELD,
      message: `${displayName} is required`
    });
  } else {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      errors.push({
        field,
        code: ERROR_CODES.INVALID_DATE_FORMAT,
        message: `Invalid ${displayName} format`,
        value: date
      });
    } else {
      if (minDate && dateObj < minDate) {
        errors.push({
          field,
          code: ERROR_CODES.INVALID_DATE_FORMAT,
          message: `${displayName} cannot be before ${minDate.toISOString()}`,
          value: date
        });
      }
      
      if (maxDate && dateObj > maxDate) {
        errors.push({
          field,
          code: ERROR_CODES.INVALID_DATE_FORMAT,
          message: `${displayName} cannot be after ${maxDate.toISOString()}`,
          value: date
        });
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Combine multiple validation results
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(result => result.errors);
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

/**
 * Throw validation error if validation fails
 */
export function throwValidationError(result: ValidationResult): never {
  if (!result.isValid) {
    const error = result.errors[0];
    throw createValidationError(error.message, error.field, {
      validationErrors: result.errors
    });
  }
  
  // This should never be reached if used correctly
  throw new Error('Unexpected validation state');
}
