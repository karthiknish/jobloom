/**
 * Types index - Re-exports all types from modular files
 */

// API types
export type {
  ApiRequestOptions,
  ErrorSeverity,
  ErrorCategory,
  ApiErrorInfo,
  Id,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
} from './api';

// Job types
export type {
  Job,
  JobData,
  JobStats,
  CreateJobRequest,
  CreateJobResponse,
  UpdateJobRequest,
  JobSite,
  SalaryInfo,
  VisaSponsorshipInfo,
  SocCodeMatch,
} from './job';

// Application types
export type {
  KanbanStatus,
  DashboardView,
  BoardMode,
  Application,
  SavedView,
  CreateApplicationRequest,
  CreateApplicationResponse,
  UpdateApplicationRequest,
} from './application';

// Subscription types
export type {
  SubscriptionPlan,
  UserTier,
  SubscriptionLimits,
  Subscription,
} from './subscription';

// CV Analysis types
export type {
  CvAnalysis,
  CvStats,
  CvAnalysisExtended,
} from './cv-analysis';

// Sponsorship types
export type {
  SponsoredCompany,
  SponsorshipStats,
  CompanySponsorshipResult,
  SponsorLookupResult,
  SponsorLookupOptions,
} from './sponsorship';

// Blog types
export type {
  BlogPost,
  BlogCategory,
  BlogStats,
} from './blog';

// Contact types
export type {
  ContactSubmission,
} from './contact';

// Activity types
export type {
  ActivityLog,
  Notification,
} from './activity';

// Feedback types
export type {
  FeedbackSentiment,
  AiFeedback,
  CreateAiFeedbackRequest,
} from './feedback';

// Notification types
export * from './notifications';

// Communication types
export * from './communication';
