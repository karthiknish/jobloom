/**
 * API Types - Re-exported from @hireall/shared
 * 
 * This file maintains backwards compatibility for existing imports.
 * All types are now defined in the shared package.
 */

// Re-export all types from shared package
export type {
  SponsoredCompany,
  CvAnalysis,
  CvStats,
  CvAnalysisExtended,
  SponsorshipStats,
  CompanySponsorshipResult,
  ContactSubmission,
  BlogPost,
  BlogCategory,
  BlogStats,
  SubscriptionPlan,
  UserTier,
  SubscriptionLimits,
  Subscription,
  Id,
} from "@hireall/shared";

// Re-export constants
export { SUBSCRIPTION_LIMITS } from "@hireall/shared";
