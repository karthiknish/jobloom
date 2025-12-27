/**
 * @hireall/shared - Main entry point
 * 
 * This package provides shared types, constants, and utilities
 * for the HireAll web and extension applications.
 */

// ============================================
// Re-export ApiError class
// ============================================
export { ApiError } from './ApiError';

// ============================================
// Types
// ============================================
export type {
  // API types
  ApiRequestOptions,
  ErrorSeverity,
  ErrorCategory,
  ApiErrorInfo,
  Id,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
  // Job types
  Job,
  JobStats,
  CreateJobRequest,
  CreateJobResponse,
  UpdateJobRequest,
  // Application types
  KanbanStatus,
  DashboardView,
  BoardMode,
  Application,
  SavedView,
  CreateApplicationRequest,
  CreateApplicationResponse,
  UpdateApplicationRequest,
  // Subscription types
  SubscriptionPlan,
  UserTier,
  SubscriptionLimits,
  Subscription,
  // CV Analysis types
  CvAnalysis,
  CvStats,
  CvAnalysisExtended,
  // Sponsorship types
  SponsoredCompany,
  SponsorshipStats,
  CompanySponsorshipResult,
  // Blog types
  BlogPost,
  BlogCategory,
  BlogStats,
  // Contact types
  ContactSubmission,
  // Activity types
  ActivityLog,
  Notification,
} from './types';

// ============================================
// Constants
// ============================================
export {
  // API constants
  RETRYABLE_STATUS_CODES,
  RETRYABLE_ERROR_CODES,
  API_DEFAULTS,
  // Subscription constants
  SUBSCRIPTION_LIMITS,
  // Dashboard constants
  DASHBOARD_VIEWS,
  BOARD_MODES,
  KANBAN_COLUMNS,
  STATUS_OPTIONS,
  STATUS_BADGE_CONFIG,
  GREETING_CONFIG,
  ANALYTICS_GOALS,
} from './constants';

// ============================================
// UK Visa Module
// ============================================
export {
  // Constants
  UK_VISA_DATES,
  UK_SALARY_THRESHOLDS,
  UK_HOURLY_RATES,
  UK_RQF_LEVELS,
  // Types
  UK_THRESHOLD_INFO,
  // Calculator functions
  getApplicableThreshold,
  calculateMinimumSalary,
  meetsSalaryRequirement,
  formatSalaryGBP,
} from './uk-visa';

export type {
  UkThresholdType,
  UkThresholdInfo,
} from './uk-visa';

// ============================================
// Utilities
// ============================================
export {
  // Company name utils
  normalizeCompanyName,
  stripLegalSuffixes,
  isLikelyPlaceholderCompany,
  buildCompanyQueryCandidates,
  // URL utils
  normalizeJobUrl,
  extractJobIdentifier,
} from './utils';
