// API types for the application
export type Id<T extends string> = string & { __tableName?: T };

// Define types for the sponsored companies
export interface SponsoredCompany {
  _id: string; // Firestore doc id
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

// Define types for CV analysis
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

// Define types for CV statistics
export interface CvStats {
  total: number;
  averageScore: number;
  averageKeywords: number;
  successRate: number;
  totalAnalyses?: number;
  completedAnalyses?: number;
  recentAnalysis?: CvAnalysis;
}

// Define types for CV analysis (extended version)
export interface CvAnalysisExtended {
  _id: string; // Firestore doc id
  userId: string;
  // File naming can vary; include both for compatibility
  filename?: string;
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  analysisStatus: "pending" | "processing" | "completed" | "failed" | "error";
  score?: number;
  overallScore?: number;
  errorMessage?: string;
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
  summary?: string;
  createdAt: number;
  updatedAt?: number;
  targetRole?: string;
  industry?: string;
  keywordAnalysis?: {
    presentKeywords?: string[];
    missingKeywords?: string[];
    keywordDensity: number;
  };
  industryAlignment?: { score: number; feedback: string };
  sectionAnalysis?: {
    hasSummary: boolean;
    hasExperience: boolean;
    hasEducation: boolean;
    hasSkills: boolean;
    hasContact: boolean;
    missingsections?: string[];
  };
}

// Define types for sponsorship stats
export interface SponsorshipStats {
  totalSponsoredCompanies: number;
  industryStats: Record<string, number>;
  sponsorshipTypeStats: Record<string, number>;
}

// Define type for company sponsorship check results
export interface CompanySponsorshipResult {
  company: string;
  isSponsored: boolean;
  sponsorshipType: string | null;
  source: string;
  matchedName?: string;
}

// Define types for contact system
export interface ContactSubmission {
  _id: string;
  name: string;
  email: string;
  message: string;
  subject?: string;
  status: "new" | "read" | "responded" | "archived";
  createdAt: number;
  updatedAt: number;
  response?: string;
  respondedAt?: number;
  respondedBy?: string;
}

// Define types for blog system
export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  status: "draft" | "published" | "archived";
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  category: string;
  featuredImage?: string;
  readingTime?: number; // in minutes
  viewCount: number;
  likeCount: number;
}

export interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  createdAt: number;
}

export interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalLikes: number;
  postsByCategory: Record<string, number>;
}

// Define types for subscription system
export type SubscriptionPlan = "free" | "premium";

export interface SubscriptionLimits {
  cvAnalysesPerMonth: number;
  applicationsPerMonth: number;
  exportFormats: string[]; // "csv", "json", "pdf"
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customAlerts: boolean;
  teamCollaboration: boolean;
  apiAccess: boolean;
  apiRateLimit: number; // requests per minute
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
    cvAnalysesPerMonth: -1, // unlimited
    applicationsPerMonth: -1, // unlimited
    exportFormats: ["csv", "json", "pdf"],
    advancedAnalytics: true,
    prioritySupport: true,
    customAlerts: true,
    teamCollaboration: true,
    apiAccess: true,
    apiRateLimit: 200,
  },
};
