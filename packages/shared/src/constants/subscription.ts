/**
 * Subscription constants
 */

import type { SubscriptionPlan, SubscriptionLimits } from '../types/subscription';

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
