/**
 * Upstash Redis Client Configuration
 *
 * Provides Redis client for rate limiting and caching.
 * Uses Upstash's REST API which works in Edge Runtime and serverless environments.
 */

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Singleton Redis instance
let redisInstance: Redis | null = null;

/**
 * Get or create the Redis client instance
 */
export function getRedisClient(): Redis | null {
  if (redisInstance) {
    return redisInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "[Upstash] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. " +
      "Rate limiting will fall back to in-memory storage."
    );
    return null;
  }

  try {
    redisInstance = new Redis({
      url,
      token,
    });
    return redisInstance;
  } catch (error) {
    console.error("[Upstash] Failed to initialize Redis client:", error);
    return null;
  }
}

/**
 * Check if Upstash Redis is available
 */
export function isUpstashAvailable(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

// Rate limiter cache to avoid creating new instances for each endpoint
const rateLimiterCache = new Map<string, Ratelimit>();

/**
 * Create or get a cached rate limiter for a specific endpoint
 */
export function getUpstashRateLimiter(
  endpoint: string,
  maxRequests: number,
  windowMs: number
): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  const cacheKey = `${endpoint}:${maxRequests}:${windowMs}`;

  if (rateLimiterCache.has(cacheKey)) {
    return rateLimiterCache.get(cacheKey)!;
  }

  try {
    // Use sliding window algorithm for more accurate rate limiting
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
      analytics: true,
      prefix: `hireall:ratelimit:${endpoint}`,
    });

    rateLimiterCache.set(cacheKey, limiter);
    return limiter;
  } catch (error) {
    console.error(`[Upstash] Failed to create rate limiter for ${endpoint}:`, error);
    return null;
  }
}

/**
 * Create a fixed window rate limiter (more performant, less accurate)
 */
export function getUpstashFixedWindowLimiter(
  endpoint: string,
  maxRequests: number,
  windowMs: number
): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  const cacheKey = `fixed:${endpoint}:${maxRequests}:${windowMs}`;

  if (rateLimiterCache.has(cacheKey)) {
    return rateLimiterCache.get(cacheKey)!;
  }

  try {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(maxRequests, `${windowMs} ms`),
      analytics: true,
      prefix: `hireall:ratelimit:fixed:${endpoint}`,
    });

    rateLimiterCache.set(cacheKey, limiter);
    return limiter;
  } catch (error) {
    console.error(`[Upstash] Failed to create fixed window limiter for ${endpoint}:`, error);
    return null;
  }
}

/**
 * Create a token bucket rate limiter (best for burst handling)
 */
export function getUpstashTokenBucketLimiter(
  endpoint: string,
  refillRate: number,
  maxTokens: number,
  intervalMs: number
): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  const cacheKey = `bucket:${endpoint}:${refillRate}:${maxTokens}:${intervalMs}`;

  if (rateLimiterCache.has(cacheKey)) {
    return rateLimiterCache.get(cacheKey)!;
  }

  try {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.tokenBucket(refillRate, `${intervalMs} ms`, maxTokens),
      analytics: true,
      prefix: `hireall:ratelimit:bucket:${endpoint}`,
    });

    rateLimiterCache.set(cacheKey, limiter);
    return limiter;
  } catch (error) {
    console.error(`[Upstash] Failed to create token bucket limiter for ${endpoint}:`, error);
    return null;
  }
}

// Export types for convenience
export type { Ratelimit } from "@upstash/ratelimit";
export type { Redis } from "@upstash/redis";
