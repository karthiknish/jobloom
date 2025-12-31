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
    aiGenerationsPerMonth: 3,
  },
  premium: {
    cvAnalysesPerMonth: -1, // unlimited
    applicationsPerMonth: -1, // unlimited
    exportFormats: ["csv", "json", "pdf"],
    advancedAnalytics: true,
    prioritySupport: true,
    customAlerts: true,
    aiGenerationsPerMonth: -1,
  },
};
