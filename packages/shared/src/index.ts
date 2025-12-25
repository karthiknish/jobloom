// Re-export ApiError class
export { ApiError } from './ApiError';

// ============================================
// API Client Types (Unified for Extension & Web)
// ============================================

/**
 * Unified request options for API clients
 */
export interface ApiRequestOptions {
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Number of retries for transient failures (default: 3) */
  retries?: number;
  /** Delay between retries in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Skip authentication header (default: false, meaning auth is included) */
  skipAuth?: boolean;
  /** Skip global error handler (default: false) */
  skipErrorHandler?: boolean;
  /** Query parameters to append to URL */
  query?: Record<string, string | number | boolean | undefined | null>;
}

/**
 * Error severity levels for categorizing API errors
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error categories for better error handling and routing
 */
export type ErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'network'
  | 'server'
  | 'rate_limit'
  | 'subscription'
  | 'file_upload'
  | 'business_logic'
  | 'not_found'
  | 'unknown';

/**
 * Unified error information interface
 */
export interface ApiErrorInfo {
  code: string;
  message: string;
  status: number;
  requestId?: string;
  field?: string;
  details?: Record<string, any>;
  retryAfter?: number;
  timestamp?: number;
  category?: ErrorCategory;
  shouldRetry?: boolean;
  requiresAuth?: boolean;
  requiresPayment?: boolean;
  severity?: ErrorSeverity;
}

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

// ============================================
// ID and Response Types
// ============================================

export type Id<T extends string> = string & { __tableName?: T };

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, any>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    timestamp: number;
    requestId?: string;
    retryAfter?: number;
    details?: Record<string, any>;
    field?: string;
    operation?: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface SponsoredCompany {
  _id: string;
  name: string;
  aliases: string[];
  sponsorshipType: string;
  description?: string;
  website?: string;
  industry?: string;
  isActive?: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
}

export interface CvAnalysis {
  _id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  analysisType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  score?: number;
  overallScore?: number;
  keywords?: number;
  suggestions?: string[];
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  missingSkills?: string[];
  atsCompatibility?: {
    score: number;
    issues?: string[];
    suggestions?: string[];
    breakdown?: {
      structure: number;
      contact: number;
      keywords: number;
      formatting: number;
      readability: number;
      extras: number;
      impact?: number;
    };
  };
  industryAlignment?: {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    recommendations: string[];
    feedback?: string;
  };
  keywordAnalysis?: {
    totalKeywords: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    presentKeywords?: string[];
    keywordDensity: number;
    averageDensity?: number;
    optimalDensity?: number;
  };
  sectionAnalysis?: {
    hasSummary: boolean;
    hasExperience: boolean;
    hasEducation: boolean;
    hasSkills: boolean;
    hasContact: boolean;
    missingsections: string[];
    summary: {
      score: number;
      hasSummary: boolean;
      length: number;
      issues: string[];
    };
    contactInfo: {
      score: number;
      hasEmail: boolean;
      hasPhone: boolean;
      hasLinkedIn: boolean;
      issues: string[];
    };
    experience: {
      score: number;
      totalYears: number;
      relevantYears: number;
      hasDescriptions: boolean;
      hasExperience: boolean;
      issues: string[];
    };
    education: {
      score: number;
      hasDegree: boolean;
      hasInstitution: boolean;
      hasDates: boolean;
      hasEducation: boolean;
      issues: string[];
    };
    skills: {
      score: number;
      skillsCount: number;
      relevantSkills: string[];
      missingSkills: string[];
      hasSkills: boolean;
      issues: string[];
    };
  };
  targetRole?: string;
  industry?: string;
  analysisStatus?: "pending" | "processing" | "completed" | "failed" | "error";
  errorMessage?: string;
  createdAt: number;
  updatedAt?: number;
  completedAt?: number;
  error?: string;
}

export type SubscriptionPlan = "free" | "premium";
export type UserTier = "free" | "premium" | "admin";

export interface SubscriptionLimits {
  cvAnalysesPerMonth: number;
  applicationsPerMonth: number;
  exportFormats: string[];
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customAlerts: boolean;
  teamCollaboration: boolean;
  apiAccess: boolean;
  apiRateLimit: number;
}

export interface Subscription {
  _id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: "active" | "inactive" | "cancelled" | "past_due";
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  createdAt: number | null;
  updatedAt: number | null;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  billingCycle?: "monthly" | "annual" | null;
  price?: number | null;
  currency?: string | null;
  customerPortalUrl?: string | null;
  trialStart?: number | null;
  trialEnd?: number | null;
  cancelAt?: number | null;
  canceledAt?: number | null;
  endedAt?: number | null;
  latestInvoiceId?: string | null;
  latestInvoiceStatus?: string | null;
  collectionMethod?: string | null;
}

export interface SalaryRange {
  min?: number;
  max?: number;
  currency?: string;
  period?: 'hourly' | 'yearly';
}

export interface Job {
  _id: string;
  userId: string;
  title: string;
  company: string;
  location?: string;
  jobUrl?: string;
  description?: string;
  salary?: SalaryRange;
  tags?: string[];
  status: 'saved' | 'applied' | 'offered' | 'rejected' | 'withdrawn';
  notes?: string;
  isSponsored?: boolean;
  sponsorshipType?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Application {
  _id: string;
  userId: string;
  jobId: string;
  status: 'saved' | 'applied' | 'offered' | 'rejected' | 'withdrawn';
  notes?: string;
  appliedAt?: number;
  job?: Job;
  createdAt: number;
  updatedAt: number;
}

export interface CreateJobRequest {
  title: string;
  company: string;
  location?: string;
  jobUrl?: string;
  description?: string;
  salary?: SalaryRange;
  tags?: string[];
  status?: Job['status'];
}

export interface CreateJobResponse {
  id: string;
  message?: string;
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  id?: string;
}

export interface CreateApplicationRequest {
  jobId: string;
  status?: Application['status'];
  notes?: string;
}

export interface CreateApplicationResponse {
  id: string;
}

export interface UpdateApplicationRequest {
  status?: Application['status'];
  notes?: string;
}

export interface JobStats {
  total: number;
  byStatus: Record<Job['status'], number>;
  recentlyApplied: number;
  sponsorshipRate: number;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionPlan, SubscriptionLimits> = {
  free: {
    cvAnalysesPerMonth: 3,
    applicationsPerMonth: 50,
    exportFormats: ["csv"],
    advancedAnalytics: false,
    prioritySupport: false,
    customAlerts: false,
    teamCollaboration: false,
    apiAccess: false,
    apiRateLimit: 10,
  },
  premium: {
    cvAnalysesPerMonth: -1,
    applicationsPerMonth: -1,
    exportFormats: ["csv", "json", "pdf"],
    advancedAnalytics: true,
    prioritySupport: true,
    customAlerts: true,
    teamCollaboration: true,
    apiAccess: true,
    apiRateLimit: 200,
  },
};
