/**
 * Subscription-related types
 */

export type SubscriptionPlan = "free" | "premium";
export type UserTier = "free" | "premium" | "admin";

export interface SubscriptionLimits {
  cvAnalysesPerMonth: number;
  applicationsPerMonth: number;
  exportFormats: string[];
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customAlerts: boolean;
  aiGenerationsPerMonth: number;
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
