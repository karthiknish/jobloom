import { get, post } from "./apiClient";
import { clearCachedAuthToken } from "./authToken";
import { 
  TIERED_RATE_LIMITS, 
  RATE_LIMITS,
  RateLimitConfig as SharedRateLimitConfig, 
  UserTierLimits 
} from "@hireall/shared";

export interface SubscriptionDetails {
  plan?: string;
  status?: string;
  [key: string]: unknown;
}

export interface SubscriptionStatus {
  plan?: string;
  subscriptionStatus?: string;
  subscription?: SubscriptionDetails;
  isAdmin?: boolean;
  [key: string]: unknown;
}

// Re-export shared types for compatibility
export type RateLimitConfig = SharedRateLimitConfig;

export interface RateLimitState {
  count: number;
  resetTime: number;
  lastRequest: number;
  violations?: number;
  lockedUntil?: number;
  requests: number[];
}

const ABUSE_VIOLATION_THRESHOLD = 5;
const ABUSE_LOCK_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BURST_WINDOW_MS = 5000; // 5 seconds
const BURST_THRESHOLD_MULTIPLIER = 0.5; // Max 50% of allowed requests in burst window

/**
 * Record a violation and check for lockout
 */
function recordViolation(state: RateLimitState, endpoint: string): void {
  const now = Date.now();
  state.violations = (state.violations || 0) + 1;
  
  if (state.violations >= ABUSE_VIOLATION_THRESHOLD) {
    state.lockedUntil = now + ABUSE_LOCK_WINDOW_MS;
    console.warn(`[RateLimiter] Abuse detected for ${endpoint}. Local lockout enabled.`);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  resetIn?: number;
  remaining?: number;
  maxRequests?: number;
  retryAfter?: number;
}

export type UserTier = 'free' | 'premium' | 'admin';

// TIERED_RATE_LIMITS and RATE_LIMITS imported from @hireall/shared
export { TIERED_RATE_LIMITS, RATE_LIMITS };

// Global rate limiting state
const rateLimitState = new Map<string, RateLimitState>();

/**
 * Reset all rate limit states (primarily for testing)
 */
export function resetRateLimitState(): void {
  rateLimitState.clear();
}
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

// Subscription status fetch de-dupe/cache to avoid spamming the backend
let subscriptionStatusInFlight: Promise<SubscriptionStatus | null> | null = null;
let subscriptionStatusCache: { value: SubscriptionStatus | null; fetchedAt: number } = {
  value: null,
  fetchedAt: 0,
};
const SUBSCRIPTION_STATUS_CACHE_MS = 30 * 1000;

const SUBSCRIPTION_STATUS_TIMEOUT_MS = 5000;
const SUBSCRIPTION_STATUS_PROXY_TIMEOUT_MS = 2000;
const USER_TIER_LOOKUP_TIMEOUT_MS = 750;

// Extension storage for user tier
let currentUserTier: UserTier = 'free';
let tierCheckTime = 0;
let tierLookupDepth = 0;
let tierFetchPromise: Promise<UserTier> | null = null;
const TIER_CACHE_DURATION = 10 * 60 * 1000; // Cache tier for 10 minutes (increased from 5)

export async function fetchSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  // Return cached value if it's fresh enough.
  const now = Date.now();
  if (now - subscriptionStatusCache.fetchedAt < SUBSCRIPTION_STATUS_CACHE_MS) {
    return subscriptionStatusCache.value;
  }

  // De-dupe concurrent calls.
  if (subscriptionStatusInFlight) {
    return subscriptionStatusInFlight;
  }

  const shouldProxyThroughBackground =
    typeof window !== "undefined" && window.location?.protocol !== "chrome-extension:";

  subscriptionStatusInFlight = (async () => {
    try {
      if (shouldProxyThroughBackground && typeof chrome !== "undefined" && chrome.runtime?.id) {
        const proxyValue = await new Promise<SubscriptionStatus | null>((resolve) => {
          let settled = false;
          const timeoutId = setTimeout(() => {
            if (settled) return;
            settled = true;
            console.debug(
              `Hireall: Subscription status proxy timed out after ${SUBSCRIPTION_STATUS_PROXY_TIMEOUT_MS}ms; using fallback tier`
            );
            resolve(null);
          }, SUBSCRIPTION_STATUS_PROXY_TIMEOUT_MS);

          try {
            chrome.runtime.sendMessage(
              { action: "fetchSubscriptionStatus", target: "background" },
              (response) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);

                if (chrome.runtime.lastError) {
                  console.warn(
                    "Proxy subscription status fetch failed:",
                    chrome.runtime.lastError?.message || JSON.stringify(chrome.runtime.lastError)
                  );
                  resolve(null);
                  return;
                }

                if (response?.success) {
                  resolve(response.status as SubscriptionStatus | null);
                } else {
                  console.warn(
                    "Subscription status proxy returned error:",
                    typeof response?.error === "object" ? JSON.stringify(response.error) : response?.error
                  );
                  resolve(null);
                }
              }
            );
          } catch (err) {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);
            console.warn("Proxy subscription status fetch threw:", err);
            resolve(null);
          }
        });

        subscriptionStatusCache = { value: proxyValue, fetchedAt: Date.now() };
        return proxyValue;
      }

      // Subscription status requires auth - pass true explicitly since path doesn't start with /api/app/
      const value = await get<SubscriptionStatus>("/api/subscription/status", undefined, true, {
        timeout: SUBSCRIPTION_STATUS_TIMEOUT_MS,
        retryCount: 0,
      });
      subscriptionStatusCache = { value, fetchedAt: Date.now() };
      return value;
    } catch (error: unknown) {
      const statusCode =
        typeof error === "object" && error !== null
          ? ((error as any).statusCode ?? (error as any).status)
          : undefined;

      if (statusCode === 401 || statusCode === 403) {
        chrome.storage.local.remove(["userTier"]);
        await clearCachedAuthToken();
      }
      const errorMsg = error instanceof Error ? error.message : (error instanceof DOMException ? `DOMException: ${error.name}` : String(error));
      console.warn("Failed to fetch subscription status:", errorMsg);
      // Cache the null briefly to avoid tight retry loops in the UI.
      subscriptionStatusCache = { value: null, fetchedAt: Date.now() };
      return null;
    }
  })();

  try {
    return await subscriptionStatusInFlight;
  } finally {
    subscriptionStatusInFlight = null;
  }
}

async function getCurrentUserTierWithTimeout(timeoutMs: number): Promise<UserTier> {
  try {
    return await Promise.race([
      getCurrentUserTier(),
      new Promise<UserTier>((resolve) => setTimeout(() => resolve(currentUserTier), timeoutMs)),
    ]);
  } catch {
    return currentUserTier;
  }
}

// Get current user tier from storage or server
export async function getCurrentUserTier(): Promise<UserTier> {
  const now = Date.now();

  // Return cached tier if still valid
  if (now - tierCheckTime < TIER_CACHE_DURATION) {
    return currentUserTier;
  }

  // If a fetch is already in progress, wait for it
  if (tierFetchPromise) {
    return tierFetchPromise;
  }

  tierLookupDepth++;
  
  // Create a promise that will be shared by all concurrent calls
  tierFetchPromise = (async (): Promise<UserTier> => {
    try {
      // Try to get from local storage first
      const result = await chrome.storage.local.get(['userTier', 'tierCheckTime']);
      const storedTierTime = result.tierCheckTime || 0;
      
      // Use stored tier if still valid
      if (result.userTier && now - storedTierTime < TIER_CACHE_DURATION) {
        currentUserTier = result.userTier;
        tierCheckTime = storedTierTime;
        return currentUserTier;
      }

      // Check with server if we have auth
      const status = await fetchSubscriptionStatus();
      if (status) {
        if (status.plan === 'premium' || status.subscriptionStatus === 'active') {
          currentUserTier = 'premium';
        } else if (status.subscription?.plan === 'premium' || status.subscription?.status === 'active') {
          currentUserTier = 'premium';
        } else if (status.isAdmin || status.subscription?.plan === 'admin') {
          currentUserTier = 'admin';
        } else {
          currentUserTier = 'free';
        }

        tierCheckTime = now;
        await chrome.storage.local.set({ userTier: currentUserTier, tierCheckTime: now });
        return currentUserTier;
      }

      currentUserTier = 'free';
      tierCheckTime = now;
      await chrome.storage.local.set({ userTier: currentUserTier, tierCheckTime: now });
      return currentUserTier;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : (error instanceof DOMException ? `DOMException: ${error.name}` : String(error));
      console.warn('Failed to get user tier:', errorMsg);
      return 'free';
    } finally {
      tierLookupDepth = Math.max(0, tierLookupDepth - 1);
      tierFetchPromise = null;
    }
  })();

  return tierFetchPromise;
}

function resolveRateLimitConfig(
  endpoint: string,
  overrides?: Partial<RateLimitConfig>,
  userTier?: UserTier
): RateLimitConfig {
  // Get tiered limits if available
  const tieredLimits = TIERED_RATE_LIMITS[endpoint];
  if (tieredLimits && userTier) {
    const baseConfig = tieredLimits[userTier];
    if (baseConfig) {
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
  }

  // Fallback to default limits
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
 * Check if a request should be allowed based on rate limits with user tier support
 */
export async function checkRateLimit(
  endpoint: string,
  config?: Partial<RateLimitConfig>
): Promise<{ allowed: boolean; resetIn?: number; remaining?: number; retryAfter?: number }> {
  const now = Date.now();
  const userTier = await getCurrentUserTier();
  const rateLimitConfig = resolveRateLimitConfig(endpoint, config, userTier);
  
  // Get or initialize local state
  let state = rateLimitState.get(endpoint);
  if (!state) {
    state = {
      count: 0,
      resetTime: now + rateLimitConfig.windowMs,
      lastRequest: now,
      requests: [],
      violations: 0,
    };
    rateLimitState.set(endpoint, state);
  }

  // 1. Check local lockout
  if (state.lockedUntil && now < state.lockedUntil) {
    const resetIn = state.lockedUntil - now;
    return {
      allowed: false,
      resetIn,
      remaining: 0,
      retryAfter: Math.ceil(resetIn / 1000),
    };
  }

  // 2. Local sliding window & burst check
  const windowStart = now - rateLimitConfig.windowMs;
  state.requests = state.requests.filter(ts => ts > windowStart);
  
  const burstWindowStart = now - BURST_WINDOW_MS;
  const burstCount = state.requests.filter(ts => ts > burstWindowStart).length;
  const burstLimit = Math.ceil(rateLimitConfig.maxRequests * BURST_THRESHOLD_MULTIPLIER);
  
  const isBurstExceeded = burstCount >= burstLimit;
  const isLimitExceeded = state.requests.length >= rateLimitConfig.maxRequests;

  if (isLimitExceeded || isBurstExceeded) {
    recordViolation(state, endpoint);

    const resetIn = isBurstExceeded ? BURST_WINDOW_MS : rateLimitConfig.windowMs;
    return {
      allowed: false,
      resetIn,
      remaining: 0,
      retryAfter: Math.ceil(resetIn / 1000),
    };
  }

  // 3. Defer to server-side rate limiting for final confirmation
  try {
    const serverCheck = await post<RateLimitResult>('/api/rate-limit-check', { endpoint }, true, {
      retryCount: 0,
      timeout: 2500,
    });

    if (serverCheck && serverCheck.allowed) {
      // Record successful request in local sliding window
      state.requests.push(now);
      state.count = state.requests.length;
      state.lastRequest = now;
      
      return {
        allowed: true,
        resetIn: serverCheck.resetIn,
        remaining: serverCheck.remaining,
        retryAfter: serverCheck.retryAfter,
      };
    }

    // Server says no - record violation locally too
    recordViolation(state, endpoint);
    
    return {
      allowed: false,
      resetIn: serverCheck?.resetIn,
      remaining: serverCheck?.remaining,
      retryAfter: serverCheck?.retryAfter ?? 60,
    };
  } catch (err) {
    // If server is down, we allow the request based on local check ONLY
    // provided we haven't hit local limits (which we already checked above).
    // This provides resilience.
    console.warn('Rate limit server check failed; falling back to local state', { endpoint });
    
    state.requests.push(now);
    state.count = state.requests.length;
    state.lastRequest = now;
    
    return {
      allowed: true,
      resetIn: rateLimitConfig.windowMs,
      remaining: rateLimitConfig.maxRequests - state.requests.length,
      retryAfter: 0,
    };
  }
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
    const rateCheck = await checkRateLimit(endpoint, config);

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
export const sponsorBatchLimiter = new BatchRateLimiter('sponsor-lookup', 5, 50);
