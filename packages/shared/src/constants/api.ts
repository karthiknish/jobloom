/**
 * API constants
 */

/**
 * HTTP status codes that should trigger automatic retry
 */
export const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504] as const;

/**
 * Network error codes that should trigger automatic retry
 */
export const RETRYABLE_ERROR_CODES = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ENETUNREACH',
  'ECONNREFUSED',
] as const;

/**
 * Default API client configuration values
 */
export const API_DEFAULTS = {
  /** Default request timeout in milliseconds */
  timeout: 30000,
  /** Default number of retries */
  retries: 3,
  /** Default delay between retries in milliseconds */
  retryDelay: 1000,
} as const;
