// Unified rate limiting system for the Hireall web application
// Matches the extension's rate limiting configuration for consistency

import { SecurityLogger } from "@/utils/security";

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  endpoint?: string;
}

export interface RateLimitState {
  count: number;
  resetTime: number;
  lastRequest: number;
  violations?: number;
  lockedUntil?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  resetIn?: number;
  remaining?: number;
  maxRequests?: number;
  retryAfter?: number;
  identifier?: string;
  violations?: number;
  abuseDetected?: boolean;
}

export interface UserTierLimits {
  free: RateLimitConfig;
  premium: RateLimitConfig;
  admin: RateLimitConfig;
}

// Enhanced rate limits with user tiers
export const TIERED_RATE_LIMITS: Record<string, UserTierLimits> = {
  // Job operations
  'job-add': {
    free: { maxRequests: 10, windowMs: 60000 },     // 10 per minute for free users
    premium: { maxRequests: 50, windowMs: 60000 },   // 50 per minute for premium users
    admin: { maxRequests: 100, windowMs: 60000 },    // 100 per minute for admins
  },
  'job-sync': {
    free: { maxRequests: 5, windowMs: 60000 },
    premium: { maxRequests: 30, windowMs: 60000 },
    admin: { maxRequests: 60, windowMs: 60000 },
  },
  'jobs': {
    free: { maxRequests: 20, windowMs: 60000 },
    premium: { maxRequests: 100, windowMs: 60000 },
    admin: { maxRequests: 200, windowMs: 60000 },
  },

  // Sponsor lookups (core feature)
  'sponsor-lookup': {
    free: { maxRequests: 15, windowMs: 60000 },    // 15 lookups per minute for free users
    premium: { maxRequests: 100, windowMs: 60000 },  // 100 lookups per minute for premium users
    admin: { maxRequests: 500, windowMs: 60000 },    // 500 lookups per minute for admins
  },
  'sponsor-batch': {
    free: { maxRequests: 2, windowMs: 60000 },
    premium: { maxRequests: 20, windowMs: 60000 },
    admin: { maxRequests: 50, windowMs: 60000 },
  },
  'sponsorship': {
    free: { maxRequests: 15, windowMs: 60000 },
    premium: { maxRequests: 100, windowMs: 60000 },
    admin: { maxRequests: 500, windowMs: 60000 },
  },

  // User operations
  'user-settings': {
    free: { maxRequests: 5, windowMs: 60000 },
    premium: { maxRequests: 20, windowMs: 60000 },
    admin: { maxRequests: 50, windowMs: 60000 },
  },
  'user-profile': {
    free: { maxRequests: 2, windowMs: 60000 },
    premium: { maxRequests: 10, windowMs: 60000 },
    admin: { maxRequests: 20, windowMs: 60000 },
  },
  'subscription': {
    free: { maxRequests: 2, windowMs: 60000 },
    premium: { maxRequests: 10, windowMs: 60000 },
    admin: { maxRequests: 20, windowMs: 60000 },
  },

  // CV operations
  'cv-analysis': {
    free: { maxRequests: 10, windowMs: 60000 },      // 10 CV analyses per minute for free users (includes reads)
    premium: { maxRequests: 50, windowMs: 60000 },   // 50 CV analyses per minute for premium users
    admin: { maxRequests: 150, windowMs: 60000 },
  },
  'cv-upload': {
    free: { maxRequests: 3, windowMs: 60000 },       // Keep upload limit strict
    premium: { maxRequests: 20, windowMs: 60000 },
    admin: { maxRequests: 50, windowMs: 60000 },
  },

  // Application operations
  'applications': {
    free: { maxRequests: 15, windowMs: 60000 },
    premium: { maxRequests: 100, windowMs: 60000 },
    admin: { maxRequests: 200, windowMs: 60000 },
  },

  // General API calls
  'general': {
    free: { maxRequests: 30, windowMs: 60000 },
    premium: { maxRequests: 200, windowMs: 60000 },
    admin: { maxRequests: 500, windowMs: 60000 },
  },
  
  // Admin operations
  'admin': {
    free: { maxRequests: 1, windowMs: 60000 },
    premium: { maxRequests: 10, windowMs: 60000 },
    admin: { maxRequests: 50, windowMs: 60000 },
  },
  'addSponsoredCompany': {
    free: { maxRequests: 1, windowMs: 60000 },
    premium: { maxRequests: 5, windowMs: 60000 },
    admin: { maxRequests: 20, windowMs: 60000 },
  },
  'blog-admin': {
    free: { maxRequests: 10, windowMs: 60000 },
    premium: { maxRequests: 120, windowMs: 60000 },
    admin: { maxRequests: 300, windowMs: 60000 },
  },

  // AI operations - strict limits to protect Gemini API quota
  'ai-generation': {
    free: { maxRequests: 5, windowMs: 60000 },      // 5 per minute for free users
    premium: { maxRequests: 20, windowMs: 60000 },  // 20 per minute for premium users
    admin: { maxRequests: 50, windowMs: 60000 },    // 50 per minute for admins
  },
  'ai-cover-letter': {
    free: { maxRequests: 3, windowMs: 60000 },      // 3 per minute
    premium: { maxRequests: 15, windowMs: 60000 },  // 15 per minute
    admin: { maxRequests: 30, windowMs: 60000 },    // 30 per minute
  },
  'ai-resume': {
    free: { maxRequests: 3, windowMs: 60000 },
    premium: { maxRequests: 15, windowMs: 60000 },
    admin: { maxRequests: 30, windowMs: 60000 },
  },
  'ai-chatbot': {
    free: { maxRequests: 10, windowMs: 60000 },     // 10 per minute (conversational)
    premium: { maxRequests: 30, windowMs: 60000 },
    admin: { maxRequests: 60, windowMs: 60000 },
  },
  'ai-editor': {
    free: { maxRequests: 5, windowMs: 60000 },
    premium: { maxRequests: 20, windowMs: 60000 },
    admin: { maxRequests: 40, windowMs: 60000 },
  },
};

// Default rate limits for backward compatibility
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'job-add': { maxRequests: 30, windowMs: 60000 },
  'job-sync': { maxRequests: 20, windowMs: 60000 },
  'jobs': { maxRequests: 50, windowMs: 60000 },
  'sponsor-lookup': { maxRequests: 50, windowMs: 60000 },
  'sponsor-batch': { maxRequests: 10, windowMs: 60000 },
  'sponsorship': { maxRequests: 50, windowMs: 60000 },
  'user-settings': { maxRequests: 10, windowMs: 60000 },
  'user-profile': { maxRequests: 5, windowMs: 60000 },
  'subscription': { maxRequests: 5, windowMs: 60000 },
  'cv-analysis': { maxRequests: 20, windowMs: 60000 },
  'cv-upload': { maxRequests: 10, windowMs: 60000 },
  'applications': { maxRequests: 50, windowMs: 60000 },
  'general': { maxRequests: 100, windowMs: 60000 },
  'admin': { maxRequests: 5, windowMs: 60000 },
  'addSponsoredCompany': { maxRequests: 5, windowMs: 60000 },
  'blog-admin': { maxRequests: 150, windowMs: 60000 },
};

export type UserTier = 'free' | 'premium' | 'admin';

// Enhanced rate limiting state with sliding window support
interface EnhancedRateLimitState extends RateLimitState {
  requests: number[];  // Array of timestamps for sliding window
  burstCount: number;  // Requests in last 5 seconds  
  lastBurstCheck: number;
}

// In-memory rate limiting store for server-side
// In production, this should be replaced with Redis or similar
const serverRateLimitStore = new Map<string, EnhancedRateLimitState>();

// Abuse detection thresholds
const ABUSE_VIOLATION_THRESHOLD = 5;
const ABUSE_LOCK_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BURST_WINDOW_MS = 5000; // 5 seconds
const BURST_THRESHOLD_MULTIPLIER = 0.5; // Max 50% of allowed requests in burst window
const CLEANUP_INTERVAL_MS = 60 * 1000; // Clean up every minute
const MAX_STORE_SIZE = 10000; // Max number of tracked identifiers

// Auto-cleanup expired entries
let lastCleanup = Date.now();

function performCleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  
  lastCleanup = now;
  let cleaned = 0;
  
  for (const [key, state] of serverRateLimitStore.entries()) {
    // Remove entries that haven't been accessed in 2x the window time
    const maxAge = (state.resetTime - state.lastRequest) * 2 || 120000;
    if (now - state.lastRequest > maxAge) {
      serverRateLimitStore.delete(key);
      cleaned++;
    }
  }
  
  // If still too large, remove oldest entries
  if (serverRateLimitStore.size > MAX_STORE_SIZE) {
    const entries = Array.from(serverRateLimitStore.entries())
      .sort((a, b) => a[1].lastRequest - b[1].lastRequest);
    
    const toRemove = entries.slice(0, serverRateLimitStore.size - MAX_STORE_SIZE + 1000);
    for (const [key] of toRemove) {
      serverRateLimitStore.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[RateLimiter] Cleaned up ${cleaned} expired entries, ${serverRateLimitStore.size} remaining`);
  }
}

// Sliding window rate limit check with burst protection
function checkSlidingWindow(
  state: EnhancedRateLimitState,
  config: RateLimitConfig,
  now: number
): { allowed: boolean; burstExceeded: boolean } {
  // Clean old requests outside the window
  const windowStart = now - config.windowMs;
  state.requests = state.requests.filter(ts => ts > windowStart);
  
  // Check burst (too many requests in short period)
  const burstWindowStart = now - BURST_WINDOW_MS;
  const burstCount = state.requests.filter(ts => ts > burstWindowStart).length;
  const burstLimit = Math.ceil(config.maxRequests * BURST_THRESHOLD_MULTIPLIER);
  const burstExceeded = burstCount >= burstLimit;
  
  // Check overall limit
  const allowed = state.requests.length < config.maxRequests && !burstExceeded;
  
  return { allowed, burstExceeded };
}

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

// Server-side rate limiting functions with user tier support
export function getRateLimitConfig(endpoint: string, userTier: UserTier = 'free'): RateLimitConfig {
  const tieredLimits = TIERED_RATE_LIMITS[endpoint];
  if (tieredLimits) {
    return tieredLimits[userTier];
  }
  return RATE_LIMITS[endpoint] || RATE_LIMITS.general;
}

export function checkServerRateLimit(
  identifier: string,
  endpoint: string,
  config?: Partial<RateLimitConfig>,
  userTier: UserTier = 'free'
): RateLimitResult {
  // Perform cleanup periodically
  performCleanup();
  
  const rateLimitConfig = { ...getRateLimitConfig(endpoint, userTier), ...config };
  const now = Date.now();
  const stateKey = `${identifier}:${endpoint}:${userTier}`;
  let state = serverRateLimitStore.get(stateKey);

  // If no state exists, create new one
  if (!state) {
    const newState: EnhancedRateLimitState = {
      count: 1,
      resetTime: now + rateLimitConfig.windowMs,
      lastRequest: now,
      violations: 0,
      lockedUntil: undefined,
      requests: [now],
      burstCount: 1,
      lastBurstCheck: now,
    };
    serverRateLimitStore.set(stateKey, newState);
    return {
      allowed: true,
      remaining: rateLimitConfig.maxRequests - 1,
      maxRequests: rateLimitConfig.maxRequests,
      resetIn: rateLimitConfig.windowMs,
      identifier,
      retryAfter: 0,
      violations: 0,
      abuseDetected: false,
    };
  }

  // Check if locked out due to abuse
  if (state.lockedUntil && now < state.lockedUntil) {
    const resetIn = state.lockedUntil - now;
    return {
      allowed: false,
      resetIn,
      remaining: 0,
      maxRequests: rateLimitConfig.maxRequests,
      identifier,
      retryAfter: Math.ceil(resetIn / 1000),
      violations: state.violations,
      abuseDetected: true,
    };
  }

  // Clear lockout if expired
  if (state.lockedUntil && now >= state.lockedUntil) {
    state.lockedUntil = undefined;
    state.violations = Math.max(0, (state.violations || 0) - 1); // Gradually reduce violations
    state.requests = [];
  }

  // Use sliding window check
  const slidingResult = checkSlidingWindow(state, rateLimitConfig, now);
  
  // Check if we've exceeded the limit or burst threshold
  if (!slidingResult.allowed) {
    const resetIn = rateLimitConfig.windowMs;
    
    // Increment violation count for potential penalties
    state.violations = (state.violations || 0) + 1;
    
    // Exponential backoff penalty for repeat violators
    const penaltyMultiplier = Math.pow(2, Math.min(state.violations - 1, 5)); // Max 32x
    const basePenalty = 5000; // 5 seconds base
    const penaltyDelay = Math.min(basePenalty * penaltyMultiplier, 300000); // Max 5 minutes

    // Log burst abuse
    if (slidingResult.burstExceeded) {
      SecurityLogger.logSecurityEvent({
        type: "suspicious_request",
        severity: "medium",
        ip: identifier,
        details: {
          endpoint,
          reason: "burst_detected",
          burstCount: state.requests.filter(ts => ts > now - BURST_WINDOW_MS).length,
          violations: state.violations,
        },
      });
    }

    // Lock out severe abusers
    if (state.violations >= ABUSE_VIOLATION_THRESHOLD) {
      const lockDuration = ABUSE_LOCK_WINDOW_MS * Math.min(state.violations - ABUSE_VIOLATION_THRESHOLD + 1, 4);
      state.lockedUntil = now + lockDuration;
      
      SecurityLogger.logSecurityEvent({
        type: "suspicious_request",
        severity: "high",
        ip: identifier,
        details: {
          endpoint,
          violations: state.violations,
          lockoutMs: lockDuration,
          reason: "repeated_violations",
        },
      });
      
      return {
        allowed: false,
        resetIn: lockDuration,
        remaining: 0,
        maxRequests: rateLimitConfig.maxRequests,
        identifier,
        retryAfter: Math.ceil(lockDuration / 1000),
        violations: state.violations,
        abuseDetected: true,
      };
    }
    
    return {
      allowed: false,
      resetIn: resetIn + penaltyDelay,
      remaining: 0,
      maxRequests: rateLimitConfig.maxRequests,
      identifier,
      retryAfter: Math.ceil((resetIn + penaltyDelay) / 1000),
      violations: state.violations,
      abuseDetected: slidingResult.burstExceeded,
    };
  }

  // Request allowed - add to sliding window
  state.requests.push(now);
  state.count = state.requests.length;
  state.lastRequest = now;

  // Gradually decrease violations for good behavior
  if (state.violations && state.violations > 0) {
    // If it's been a while since last request, reduce violations
    const timeSinceLastBurstCheck = now - state.lastBurstCheck;
    if (timeSinceLastBurstCheck > rateLimitConfig.windowMs * 2) {
      state.violations = Math.max(0, state.violations - 1);
      state.lastBurstCheck = now;
    }
  }

  return {
    allowed: true,
    remaining: rateLimitConfig.maxRequests - state.requests.length,
    resetIn: rateLimitConfig.windowMs,
    maxRequests: rateLimitConfig.maxRequests,
    identifier,
    retryAfter: 0,
    violations: state.violations,
    abuseDetected: false,
  };
}

// Enhanced function to determine user tier from Firebase auth or request
export async function getUserTierFromAuth(authToken?: string): Promise<UserTier> {
  // For now, return 'premium' for all authenticated users to avoid middleware issues
  // In a real implementation, you would verify the token and check user subscription
  if (!authToken) return 'free';
  
  try {
    // Simple decode of JWT to get basic info (without verification for speed)
    const parts = authToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      // Admin users get admin tier
      if (payload.email && (
        payload.email.includes('admin') || 
        payload.email.endsWith('@hireall.app')
      )) {
        return 'admin';
      }
    }
  } catch (error) {
    // If token parsing fails, continue with default tier
  }
  
  return 'premium'; // Default to premium for authenticated users
}

// Rate limiting with automatic user tier detection
export async function checkServerRateLimitWithAuth(
  identifier: string,
  endpoint: string,
  authToken?: string,
  config?: Partial<RateLimitConfig>
): Promise<RateLimitResult> {
  const userTier = await getUserTierFromAuth(authToken);
  return checkServerRateLimit(identifier, endpoint, config, userTier);
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
  if (path.includes('/blog/admin')) return 'blog-admin';
  if (path.includes('/blog')) return 'general';
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