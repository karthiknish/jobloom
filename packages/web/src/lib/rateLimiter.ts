// Unified rate limiting system for the Hireall web application
// Matches the extension's rate limiting configuration for consistency

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

export interface RateLimitResult {
  allowed: boolean;
  resetIn?: number;
  remaining?: number;
  maxRequests?: number;
}

// Default rate limits for different API endpoints - matching extension configuration
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Job operations (more permissive since users need to add jobs)
  'job-add': { maxRequests: 30, windowMs: 60000 }, // 30 requests per minute
  'job-sync': { maxRequests: 20, windowMs: 60000 }, // 20 sync operations per minute
  'jobs': { maxRequests: 50, windowMs: 60000 }, // 50 job operations per minute

  // Sponsor lookups (moderate limits to avoid overwhelming API)
  'sponsor-lookup': { maxRequests: 50, windowMs: 60000 }, // 50 lookups per minute
  'sponsor-batch': { maxRequests: 10, windowMs: 60000 }, // 10 batch operations per minute
  'sponsorship': { maxRequests: 50, windowMs: 60000 }, // Alias for sponsor-lookup

  // User operations (more restrictive)
  'user-settings': { maxRequests: 10, windowMs: 60000 }, // 10 settings updates per minute
  'user-profile': { maxRequests: 5, windowMs: 60000 }, // 5 profile updates per minute
  'subscription': { maxRequests: 5, windowMs: 60000 }, // 5 subscription operations per minute

  // CV operations
  'cv-analysis': { maxRequests: 20, windowMs: 60000 }, // 20 CV analyses per minute
  'cv-upload': { maxRequests: 10, windowMs: 60000 }, // 10 CV uploads per minute

  // Application operations
  'applications': { maxRequests: 50, windowMs: 60000 }, // 50 application operations per minute

  // General API calls
  'general': { maxRequests: 100, windowMs: 60000 }, // 100 general requests per minute
};

// In-memory rate limiting store for server-side
// In production, this should be replaced with Redis or similar
const serverRateLimitStore = new Map<string, RateLimitState>();

// Client-side rate limiting utilities
export class ClientRateLimiter {
  private storageKey: string;

  constructor(private endpoint: string, private config: RateLimitConfig) {
    this.storageKey = `rateLimit_${endpoint}`;
  }

  checkRateLimit(): RateLimitResult {
    if (typeof window === 'undefined') {
      // Server-side rendering fallback
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        maxRequests: this.config.maxRequests,
        resetIn: this.config.windowMs,
      };
    }

    const now = Date.now();
    const stored = localStorage.getItem(this.storageKey);
    let state: RateLimitState;

    if (stored) {
      state = JSON.parse(stored);
      
      // Reset if window has expired
      if (now > state.resetTime) {
        state = {
          count: 1,
          resetTime: now + this.config.windowMs,
          lastRequest: now,
        };
      } else {
        state.count++;
        state.lastRequest = now;
      }
    } else {
      state = {
        count: 1,
        resetTime: now + this.config.windowMs,
        lastRequest: now,
      };
    }

    localStorage.setItem(this.storageKey, JSON.stringify(state));

    const allowed = state.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - state.count);
    const resetIn = Math.max(0, state.resetTime - now);

    return {
      allowed,
      remaining,
      maxRequests: this.config.maxRequests,
      resetIn,
    };
  }

  getRemainingRequests(): number {
    if (typeof window === 'undefined') return this.config.maxRequests;

    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return this.config.maxRequests;

    const state: RateLimitState = JSON.parse(stored);
    const now = Date.now();

    if (now > state.resetTime) return this.config.maxRequests;

    return Math.max(0, this.config.maxRequests - state.count);
  }

  getTimeUntilReset(): number {
    if (typeof window === 'undefined') return 0;

    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return 0;

    const state: RateLimitState = JSON.parse(stored);
    const now = Date.now();

    return Math.max(0, state.resetTime - now);
  }

  reset(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.storageKey);
  }
}

// Server-side rate limiting functions
export function getRateLimitConfig(endpoint: string): RateLimitConfig {
  return RATE_LIMITS[endpoint] || RATE_LIMITS.general;
}

export function checkServerRateLimit(
  identifier: string,
  endpoint: string,
  config?: Partial<RateLimitConfig>
): RateLimitResult {
  const rateLimitConfig = { ...getRateLimitConfig(endpoint), ...config };
  const now = Date.now();
  const stateKey = `${identifier}:${endpoint}`;
  const state = serverRateLimitStore.get(stateKey);

  // If no state exists or window has expired, reset
  if (!state || now > state.resetTime) {
    const newState: RateLimitState = {
      count: 1,
      resetTime: now + rateLimitConfig.windowMs,
      lastRequest: now,
    };
    serverRateLimitStore.set(stateKey, newState);
    return {
      allowed: true,
      remaining: rateLimitConfig.maxRequests - 1,
      maxRequests: rateLimitConfig.maxRequests,
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
      maxRequests: rateLimitConfig.maxRequests,
    };
  }

  // Increment counter and allow request
  state.count++;
  state.lastRequest = now;

  return {
    allowed: true,
    remaining: rateLimitConfig.maxRequests - state.count,
    resetIn: state.resetTime - now,
    maxRequests: rateLimitConfig.maxRequests,
  };
}

export function getServerRateLimitStatus(
  identifier: string,
  endpoint: string
): RateLimitResult {
  const config = getRateLimitConfig(endpoint);
  const stateKey = `${identifier}:${endpoint}`;
  const state = serverRateLimitStore.get(stateKey);

  if (!state) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      maxRequests: config.maxRequests,
      resetIn: 0,
    };
  }

  const now = Date.now();
  const resetIn = Math.max(0, state.resetTime - now);
  const remaining = Math.max(0, config.maxRequests - state.count);
  const allowed = remaining > 0 || now > state.resetTime;

  return {
    allowed,
    remaining,
    maxRequests: config.maxRequests,
    resetIn,
  };
}

export function resetServerRateLimit(identifier: string, endpoint: string): void {
  const stateKey = `${identifier}:${endpoint}`;
  serverRateLimitStore.delete(stateKey);
}

// Clean up expired rate limit states (should be called periodically)
export function cleanupExpiredServerLimits(): void {
  const now = Date.now();
  for (const [key, state] of serverRateLimitStore.entries()) {
    if (now > state.resetTime) {
      serverRateLimitStore.delete(key);
    }
  }
}

// Utility function to determine endpoint from request path
export function getEndpointFromPath(path: string): string {
  if (path.includes('/sponsorship')) return 'sponsor-lookup';
  if (path.includes('/jobs')) return 'jobs';
  if (path.includes('/applications')) return 'applications';
  if (path.includes('/cv')) return 'cv-analysis';
  if (path.includes('/subscription')) return 'subscription';
  if (path.includes('/users/') && path.includes('/settings')) return 'user-settings';
  if (path.includes('/users/')) return 'user-profile';
  
  return 'general';
}

// Create a rate-limited wrapper for API functions
export function createRateLimitedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  endpoint: string,
  identifier: string,
  config?: Partial<RateLimitConfig>
) {
  return async (...args: T): Promise<R> => {
    const rateCheck = checkServerRateLimit(identifier, endpoint, config);

    if (!rateCheck.allowed) {
      const error = new Error(
        `Rate limit exceeded for ${endpoint}. Try again in ${Math.ceil(
          (rateCheck.resetIn || 0) / 1000
        )} seconds.`
      );
      (error as any).rateLimitInfo = rateCheck;
      (error as any).statusCode = 429;
      throw error;
    }

    return fn(...args);
  };
}

// Export a singleton instance for common endpoints
export const rateLimiters = {
  sponsor: new ClientRateLimiter('sponsor-lookup', RATE_LIMITS['sponsor-lookup']),
  jobs: new ClientRateLimiter('jobs', RATE_LIMITS.jobs),
  applications: new ClientRateLimiter('applications', RATE_LIMITS.applications),
  cvAnalysis: new ClientRateLimiter('cv-analysis', RATE_LIMITS['cv-analysis']),
  subscription: new ClientRateLimiter('subscription', RATE_LIMITS.subscription),
  general: new ClientRateLimiter('general', RATE_LIMITS.general),
};

export default {
  RATE_LIMITS,
  ClientRateLimiter,
  checkServerRateLimit,
  getServerRateLimitStatus,
  getEndpointFromPath,
  createRateLimitedFunction,
  rateLimiters,
};