/**
 * Conversion Funnel Tracking & User Behavior Analytics
 * 
 * Defines conversion funnels and provides utilities for tracking
 * user progression through key conversion paths.
 */

import { ANALYTICS_EVENTS } from './analytics-events';

// Conversion Funnel Definitions
export const CONVERSION_FUNNELS = {
  // Signup to Upgrade Funnel
  SIGNUP_TO_PREMIUM: {
    name: 'signup_to_premium',
    steps: [
      { id: 'landing_page', event: ANALYTICS_EVENTS.PAGE_VIEW, filter: { page_name: '/' } },
      { id: 'signup_started', event: ANALYTICS_EVENTS.PAGE_VIEW, filter: { page_name: '/sign-up' } },
      { id: 'account_created', event: ANALYTICS_EVENTS.SIGN_UP },
      { id: 'first_job_added', event: ANALYTICS_EVENTS.JOB_SAVED },
      { id: 'cv_uploaded', event: ANALYTICS_EVENTS.CV_UPLOADED },
      { id: 'upgrade_viewed', event: ANALYTICS_EVENTS.PAGE_VIEW, filter: { page_name: '/upgrade' } },
      { id: 'subscription_upgraded', event: ANALYTICS_EVENTS.SUBSCRIPTION_UPGRADED },
    ],
  },
  
  // Job Application Funnel
  JOB_APPLICATION: {
    name: 'job_application',
    steps: [
      { id: 'job_viewed', event: ANALYTICS_EVENTS.JOB_VIEWED },
      { id: 'job_saved', event: ANALYTICS_EVENTS.JOB_SAVED },
      { id: 'application_created', event: ANALYTICS_EVENTS.APPLICATION_CREATED },
      { id: 'status_applied', event: ANALYTICS_EVENTS.APPLICATION_STATUS_CHANGED, filter: { new_status: 'applied' } },
      { id: 'status_interviewing', event: ANALYTICS_EVENTS.APPLICATION_STATUS_CHANGED, filter: { new_status: 'interviewing' } },
      { id: 'status_offered', event: ANALYTICS_EVENTS.APPLICATION_STATUS_CHANGED, filter: { new_status: 'offered' } },
    ],
  },
  
  // CV Evaluation Funnel
  CV_EVALUATION: {
    name: 'cv_evaluation',
    steps: [
      { id: 'cv_page_viewed', event: ANALYTICS_EVENTS.PAGE_VIEW, filter: { page_name: '/cv-evaluator' } },
      { id: 'cv_uploaded', event: ANALYTICS_EVENTS.CV_UPLOADED },
      { id: 'cv_analyzed', event: ANALYTICS_EVENTS.CV_ANALYZED },
      { id: 'cv_downloaded', event: ANALYTICS_EVENTS.CV_DOWNLOAD },
    ],
  },
  
  // Extension Adoption Funnel
  EXTENSION_ADOPTION: {
    name: 'extension_adoption',
    steps: [
      { id: 'extension_page_viewed', event: ANALYTICS_EVENTS.PAGE_VIEW, filter: { page_name: '/extension' } },
      { id: 'extension_connected', event: ANALYTICS_EVENTS.EXTENSION_CONNECTED },
      { id: 'first_job_imported', event: ANALYTICS_EVENTS.JOB_IMPORTED },
      { id: 'sponsor_check_used', event: ANALYTICS_EVENTS.JOB_SPONSOR_CHECK },
    ],
  },
  
  // Activation Funnel (First 7 days)
  ACTIVATION: {
    name: 'user_activation',
    steps: [
      { id: 'account_created', event: ANALYTICS_EVENTS.SIGN_UP },
      { id: 'profile_completed', event: ANALYTICS_EVENTS.SETTINGS_UPDATED },
      { id: 'first_job_added', event: ANALYTICS_EVENTS.JOB_SAVED },
      { id: 'cv_uploaded', event: ANALYTICS_EVENTS.CV_UPLOADED },
      { id: 'extension_connected', event: ANALYTICS_EVENTS.EXTENSION_CONNECTED },
      { id: 'applied_to_job', event: ANALYTICS_EVENTS.APPLICATION_STATUS_CHANGED, filter: { new_status: 'applied' } },
    ],
  },
} as const;

// User Behavior Segments
export const USER_SEGMENTS = {
  NEW_USER: {
    name: 'new_user',
    description: 'Users who signed up in the last 7 days',
    criteria: { account_age_days: { max: 7 } },
  },
  ACTIVE_JOB_SEEKER: {
    name: 'active_job_seeker',
    description: 'Users with 10+ applications and logged in within 7 days',
    criteria: { jobs_applied_count: { min: 10 }, last_login_days: { max: 7 } },
  },
  POWER_USER: {
    name: 'power_user',
    description: 'Premium users with high engagement',
    criteria: { user_type: 'premium', jobs_applied_count: { min: 25 } },
  },
  AT_RISK: {
    name: 'at_risk',
    description: 'Users with no activity in 14+ days',
    criteria: { last_login_days: { min: 14 } },
  },
  EXTENSION_USER: {
    name: 'extension_user',
    description: 'Users who have connected the extension',
    criteria: { has_extension: true },
  },
} as const;

// Feature Usage Tracking
export interface FeatureUsageStats {
  feature: string;
  usageCount: number;
  lastUsed: Date | null;
  firstUsed: Date | null;
  avgTimeSpentSeconds: number;
}

// Session Analytics
export interface SessionAnalytics {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  pagesViewed: string[];
  eventsTriggered: string[];
  conversions: string[];
  referrer: string | null;
  device: 'desktop' | 'tablet' | 'mobile';
  browser: string;
}

// Engagement Score Calculation
export function calculateEngagementScore(metrics: {
  pagesViewedToday: number;
  actionsToday: number;
  daysActiveThisWeek: number;
  jobsAddedThisWeek: number;
  cvUploads: number;
  hasExtension: boolean;
}): number {
  const weights = {
    pagesViewedToday: 0.1,
    actionsToday: 0.15,
    daysActiveThisWeek: 0.25,
    jobsAddedThisWeek: 0.2,
    cvUploads: 0.15,
    hasExtension: 0.15,
  };
  
  // Normalize each metric (0-10 scale)
  const normalized = {
    pagesViewedToday: Math.min(metrics.pagesViewedToday / 10, 10),
    actionsToday: Math.min(metrics.actionsToday / 20, 10),
    daysActiveThisWeek: Math.min(metrics.daysActiveThisWeek / 7 * 10, 10),
    jobsAddedThisWeek: Math.min(metrics.jobsAddedThisWeek / 10 * 10, 10),
    cvUploads: metrics.cvUploads > 0 ? 10 : 0,
    hasExtension: metrics.hasExtension ? 10 : 0,
  };
  
  // Calculate weighted score
  const score = Object.entries(weights).reduce((total, [key, weight]) => {
    return total + (normalized[key as keyof typeof normalized] * weight);
  }, 0);
  
  return Math.round(score * 10); // 0-100 scale
}

// Conversion Rate Calculation
export function calculateConversionRate(
  startEvents: number,
  endEvents: number
): { rate: number; improvement: number | null } {
  if (startEvents === 0) return { rate: 0, improvement: null };
  
  const rate = (endEvents / startEvents) * 100;
  return { rate: Math.round(rate * 100) / 100, improvement: null };
}

// Key Metrics Types
export interface KeyMetrics {
  // Acquisition
  dailySignups: number;
  signupConversionRate: number;
  topReferrers: { source: string; count: number }[];
  
  // Activation
  activationRate: number;
  avgTimeToFirstJob: number; // in hours
  extensionAdoptionRate: number;
  
  // Engagement
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  avgSessionDuration: number;
  avgPagesPerSession: number;
  
  // Retention
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
  churnRate: number;
  
  // Revenue
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  payingCustomers: number;
  freeToPayingConversion: number;
  
  // Feature Adoption
  cvEvaluatorUsage: number;
  sponsorCheckerUsage: number;
  exportFeatureUsage: number;
}

// Event enrichment for better tracking
export interface EnrichedEvent {
  name: string;
  parameters: Record<string, any>;
  timestamp: Date;
  userId: string | null;
  sessionId: string;
  pageUrl: string;
  referrer: string | null;
  device: {
    type: 'desktop' | 'tablet' | 'mobile';
    browser: string;
    os: string;
    screenSize: string;
  };
  geo: {
    country: string | null;
    region: string | null;
    city: string | null;
  };
}

// Utility to track funnel progression
export function getFunnelStep(
  funnel: typeof CONVERSION_FUNNELS[keyof typeof CONVERSION_FUNNELS],
  completedEvents: string[]
): { currentStep: number; totalSteps: number; completedSteps: string[]; nextStep: string | null } {
  const completedSteps: string[] = [];
  let currentStep = 0;
  
  for (const step of funnel.steps) {
    if (completedEvents.includes(step.event)) {
      completedSteps.push(step.id);
      currentStep++;
    } else {
      break;
    }
  }
  
  const nextStep = currentStep < funnel.steps.length 
    ? funnel.steps[currentStep].id 
    : null;
  
  return {
    currentStep,
    totalSteps: funnel.steps.length,
    completedSteps,
    nextStep,
  };
}

// Behavior cohort analysis types
export interface CohortData {
  cohortName: string;
  cohortDate: string; // YYYY-MM-DD or YYYY-WW
  usersCount: number;
  retentionByDay: Record<number, number>; // day -> percentage
  avgEngagementScore: number;
  avgJobsApplied: number;
  conversionToPremium: number;
}
