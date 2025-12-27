/**
 * API client types
 */

/**
 * Unified request options for API clients
 */
export interface ApiRequestOptions {
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Number of retries for transient failures (default: 3) */
  retries?: number;
  /** Delay between retries in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Skip authentication header (default: false, meaning auth is included) */
  skipAuth?: boolean;
  /** Skip global error handler (default: false) */
  skipErrorHandler?: boolean;
  /** Query parameters to append to URL */
  query?: Record<string, string | number | boolean | undefined | null>;
}

/**
 * Error severity levels for categorizing API errors
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error categories for better error handling and routing
 */
export type ErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'network'
  | 'server'
  | 'rate_limit'
  | 'subscription'
  | 'file_upload'
  | 'business_logic'
  | 'not_found'
  | 'unknown';

/**
 * Unified error information interface
 */
export interface ApiErrorInfo {
  code: string;
  message: string;
  status: number;
  requestId?: string;
  field?: string;
  details?: Record<string, any>;
  retryAfter?: number;
  timestamp?: number;
  category?: ErrorCategory;
  shouldRetry?: boolean;
  requiresAuth?: boolean;
  requiresPayment?: boolean;
  severity?: ErrorSeverity;
}

export type Id<T extends string> = string & { __tableName?: T };

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, any>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    timestamp: number;
    requestId?: string;
    retryAfter?: number;
    details?: Record<string, any>;
    field?: string;
    operation?: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
