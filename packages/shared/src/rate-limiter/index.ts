/**
 * Unified rate limiting configuration for extension and web
 */

export type UserTier = 'free' | 'premium' | 'admin';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  endpoint?: string;
}

export interface UserTierLimits {
  free: RateLimitConfig;
  premium: RateLimitConfig;
  admin: RateLimitConfig;
}

export type RateLimits = Record<string, RateLimitConfig>;

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

  // Sponsor lookups
  'sponsor-lookup': {
    free: { maxRequests: 50, windowMs: 60000 },    // 50 lookups per minute for free users
    premium: { maxRequests: 200, windowMs: 60000 },  // 200 lookups per minute for premium users
    admin: { maxRequests: 1000, windowMs: 60000 },    // 1000 lookups per minute for admins
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
    free: { maxRequests: 10, windowMs: 60000 },
    premium: { maxRequests: 50, windowMs: 60000 },
    admin: { maxRequests: 200, windowMs: 60000 },
  },
};

export const RATE_LIMITS: RateLimits = {
  'job-add': { maxRequests: 30, windowMs: 60000 },
  'job-sync': { maxRequests: 20, windowMs: 60000 },
  'jobs': { maxRequests: 50, windowMs: 60000 },
  'sponsor-lookup': { maxRequests: 50, windowMs: 60000 },
  'sponsor-batch': { maxRequests: 10, windowMs: 60000 },
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
  'auth-strict': { maxRequests: 3, windowMs: 900000 }, // 3 per 15 minutes
};
