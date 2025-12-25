import { ApiErrorInfo, ErrorCategory, ErrorSeverity } from './index';

/**
 * Unified API Error class for both extension and web packages.
 * Provides consistent error handling across all API clients.
 */
export class ApiError extends Error implements ApiErrorInfo {
  public readonly code: string;
  public readonly status: number;
  public readonly requestId?: string;
  public readonly field?: string;
  public readonly details?: Record<string, any>;
  public readonly retryAfter?: number;
  public readonly timestamp?: number;
  public readonly category?: ErrorCategory;
  public readonly shouldRetry?: boolean;
  public readonly requiresAuth?: boolean;
  public readonly requiresPayment?: boolean;
  public readonly severity?: ErrorSeverity;

  constructor(info: Partial<ApiErrorInfo> & { message: string; code: string; status: number }) {
    super(info.message);
    this.name = 'ApiError';
    this.code = info.code;
    this.status = info.status;
    this.requestId = info.requestId;
    this.field = info.field;
    this.details = info.details;
    this.retryAfter = info.retryAfter;
    this.timestamp = info.timestamp ?? Date.now();
    this.category = info.category;
    this.shouldRetry = info.shouldRetry;
    this.requiresAuth = info.requiresAuth;
    this.requiresPayment = info.requiresPayment;
    this.severity = info.severity;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Type guard to check if an unknown error is an ApiError
   */
  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  /**
   * Create an ApiError from a plain object (useful for deserialization)
   */
  static fromObject(obj: ApiErrorInfo): ApiError {
    return new ApiError({
      message: obj.message,
      code: obj.code,
      status: obj.status,
      requestId: obj.requestId,
      field: obj.field,
      details: obj.details,
      retryAfter: obj.retryAfter,
      timestamp: obj.timestamp,
      category: obj.category,
      shouldRetry: obj.shouldRetry,
      requiresAuth: obj.requiresAuth,
      requiresPayment: obj.requiresPayment,
      severity: obj.severity,
    });
  }

  /**
   * Convert to a plain object (useful for serialization)
   */
  toJSON(): ApiErrorInfo {
    return {
      message: this.message,
      code: this.code,
      status: this.status,
      requestId: this.requestId,
      field: this.field,
      details: this.details,
      retryAfter: this.retryAfter,
      timestamp: this.timestamp,
      category: this.category,
      shouldRetry: this.shouldRetry,
      requiresAuth: this.requiresAuth,
      requiresPayment: this.requiresPayment,
      severity: this.severity,
    };
  }
}
