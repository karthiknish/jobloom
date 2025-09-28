// Rate limiting configuration and utilities for the extension
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  endpoint?: string;
}

export interface RateLimitState {
  count: number;
  resetTime: number;
  lastRequest: number;
}

// Default rate limits for different API endpoints
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Job operations (more permissive since users need to add jobs)
  'job-add': { maxRequests: 30, windowMs: 60000 }, // 30 requests per minute
  'job-sync': { maxRequests: 20, windowMs: 60000 }, // 20 sync operations per minute

  // Sponsor lookups (moderate limits to avoid overwhelming API)
  'sponsor-lookup': { maxRequests: 50, windowMs: 60000 }, // 50 lookups per minute
  'sponsor-batch': { maxRequests: 10, windowMs: 60000 }, // 10 batch operations per minute

  // User operations (more restrictive)
  'user-settings': { maxRequests: 10, windowMs: 60000 }, // 10 settings updates per minute
  'user-profile': { maxRequests: 5, windowMs: 60000 }, // 5 profile updates per minute

  // General API calls
  'general': { maxRequests: 100, windowMs: 60000 }, // 100 general requests per minute
};

// Global rate limiting state
const rateLimitState = new Map<string, RateLimitState>();
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

function resolveRateLimitConfig(
  endpoint: string,
  overrides?: Partial<RateLimitConfig>
): RateLimitConfig {
  const baseConfig = RATE_LIMITS[endpoint] ?? RATE_LIMITS.general;

  if (!baseConfig) {
    throw new Error(
      `Missing rate limit configuration for "${endpoint}" and no general fallback is defined.`
    );
  }

  const mergedConfig: RateLimitConfig = {
    ...baseConfig,
    ...overrides,
  };

  if (!Number.isFinite(mergedConfig.maxRequests) || mergedConfig.maxRequests <= 0) {
    throw new Error(`Invalid maxRequests for rate limiter: ${mergedConfig.maxRequests}`);
  }

  if (!Number.isFinite(mergedConfig.windowMs) || mergedConfig.windowMs <= 0) {
    throw new Error(`Invalid windowMs for rate limiter: ${mergedConfig.windowMs}`);
  }

  return mergedConfig;
}

/**
 * Check if a request should be allowed based on rate limits
 */
export function checkRateLimit(
  endpoint: string,
  config?: Partial<RateLimitConfig>
): { allowed: boolean; resetIn?: number; remaining?: number } {
  const rateLimitConfig = resolveRateLimitConfig(endpoint, config);
  const now = Date.now();
  const stateKey = config?.endpoint ?? endpoint;
  const state = rateLimitState.get(stateKey);

  // If no state exists or window has expired, reset
  if (!state || now > state.resetTime) {
    const newState: RateLimitState = {
      count: 1,
      resetTime: now + rateLimitConfig.windowMs,
      lastRequest: now,
    };
    rateLimitState.set(stateKey, newState);
    return {
      allowed: true,
      remaining: rateLimitConfig.maxRequests - 1,
      resetIn: rateLimitConfig.windowMs,
    };
  }

  // Check if we've exceeded the limit
  if (state.count >= rateLimitConfig.maxRequests) {
    const resetIn = state.resetTime - now;
    return {
      allowed: false,
      resetIn: resetIn > 0 ? resetIn : 0,
      remaining: 0,
    };
  }

  // Increment counter and allow request
  state.count++;
  state.lastRequest = now;

  return {
    allowed: true,
    remaining: rateLimitConfig.maxRequests - state.count,
    resetIn: state.resetTime - now,
  };
}

/**
 * Get time until rate limit resets
 */
export function getTimeUntilReset(endpoint: string): number {
  const state = rateLimitState.get(endpoint);
  if (!state) return 0;

  const now = Date.now();
  return Math.max(0, state.resetTime - now);
}

/**
 * Get current rate limit status for an endpoint
 */
export function getRateLimitStatus(endpoint: string): {
  remaining: number;
  resetIn: number;
  maxRequests: number;
} {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.general;
  const state = rateLimitState.get(endpoint);

  if (!state) {
    return {
      remaining: config.maxRequests,
      resetIn: 0,
      maxRequests: config.maxRequests,
    };
  }

  const now = Date.now();
  const resetIn = Math.max(0, state.resetTime - now);

  return {
    remaining: Math.max(0, config.maxRequests - state.count),
    resetIn,
    maxRequests: config.maxRequests,
  };
}

/**
 * Reset rate limit for an endpoint (useful for testing)
 */
export function resetRateLimit(endpoint: string): void {
  rateLimitState.delete(endpoint);
}

/**
 * Clean up expired rate limit states
 */
export function cleanupExpiredLimits(): void {
  const now = Date.now();
  for (const [endpoint, state] of rateLimitState.entries()) {
    if (now > state.resetTime) {
      rateLimitState.delete(endpoint);
    }
  }
}

/**
 * Initialize rate limiting cleanup interval
 */
export function initRateLimitCleanup(): void {
  if (cleanupIntervalId !== null) {
    return;
  }

  // Clean up expired limits every minute
  cleanupIntervalId = setInterval(cleanupExpiredLimits, 60000);
}

/**
 * Create a rate-limited wrapper for API calls
 */
export function createRateLimitedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  endpoint: string,
  config?: Partial<RateLimitConfig>
) {
  return async (...args: T): Promise<R> => {
    const rateCheck = checkRateLimit(endpoint, config);

    if (!rateCheck.allowed) {
      const error = new Error(
        `Rate limit exceeded for ${endpoint}. Try again in ${Math.ceil(
          (rateCheck.resetIn || 0) / 1000
        )} seconds.`
      );
      (error as any).rateLimitInfo = rateCheck;
      throw error;
    }

    return fn(...args);
  };
}

/**
 * Batch rate limiter for multiple operations
 */
export class BatchRateLimiter {
  private pendingRequests: Array<{
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private processing = false;

  constructor(
    private endpoint: string,
    private maxConcurrent: number = 5,
    private delayBetween: number = 100
  ) {}

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.pendingRequests.push({ fn, resolve, reject });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.pendingRequests.length === 0) return;

    this.processing = true;

    while (this.pendingRequests.length > 0) {
      const batch = this.pendingRequests.splice(0, this.maxConcurrent);

      // Execute batch concurrently
      const promises = batch.map(async (request) => {
        try {
          const result = await request.fn();
          request.resolve(result);
        } catch (error) {
          request.reject(error);
        }
      });

      await Promise.allSettled(promises);

      // Delay between batches
      if (this.pendingRequests.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delayBetween));
      }
    }

    this.processing = false;
  }
}

/**
 * Global batch rate limiter instance for sponsor lookups
 */
export const sponsorBatchLimiter = new BatchRateLimiter('sponsor-lookup', 3, 200);
