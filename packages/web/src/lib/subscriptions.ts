import type Stripe from "stripe";
import { getAdminDb, FieldValue, Timestamp } from "@/firebase/admin";
import { SubscriptionPlan } from "@/types/api";

export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "past_due";

const db = getAdminDb();

function normalizePlan(value?: string | null): SubscriptionPlan | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized === "free" || normalized === "premium") {
    return normalized as SubscriptionPlan;
  }
  return null;
}

function inferPlan(subscription: Stripe.Subscription, fallback?: string): SubscriptionPlan {
  const candidates = [
    subscription.metadata?.plan,
    subscription.items?.data?.[0]?.price?.metadata?.plan,
    subscription.items?.data?.[0]?.price?.lookup_key,
    subscription.items?.data?.[0]?.price?.nickname,
    fallback,
  ];

  for (const candidate of candidates) {
    const plan = normalizePlan(candidate ?? null);
    if (plan) {
      return plan;
    }
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    const value = candidate.toLowerCase();
    if (value.includes("premium")) {
      return "premium";
    }
    if (value.includes("free")) {
      return "free";
    }
  }

  return "premium";
}

function inferBillingCycle(subscription: Stripe.Subscription): "monthly" | "annual" | null {
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
  if (interval === "month") return "monthly";
  if (interval === "year") return "annual";
  return null;
}

function stripeSecondsToTimestamp(value?: number | null): Timestamp | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Timestamp.fromMillis(value * 1000);
  }
  return null;
}

function resolveLatestInvoiceInfo(latestInvoice: Stripe.Subscription["latest_invoice"]): {
  id: string | null;
  status: string | null;
} {
  if (!latestInvoice) {
    return { id: null, status: null };
  }

  if (typeof latestInvoice === "string") {
    return { id: latestInvoice, status: null };
  }

  return {
    id: latestInvoice.id ?? null,
    status: latestInvoice.status ?? null,
  };
}

// Error classes for better error handling
export class SubscriptionError extends Error {
  constructor(message: string, public code: string, public cause?: Error) {
    super(message);
    this.name = "SubscriptionError";
  }
}

export class ValidationError extends SubscriptionError {
  constructor(message: string, public field?: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class StripeError extends SubscriptionError {
  constructor(message: string, public stripeCode?: string, public cause?: Error) {
    super(message, "STRIPE_ERROR", cause);
    this.name = "StripeError";
  }
}

export class DatabaseError extends SubscriptionError {
  constructor(message: string, public operation?: string, public cause?: Error) {
    super(message, "DATABASE_ERROR", cause);
    this.name = "DatabaseError";
  }
}

// Validation functions
function validateUserId(userId: string): void {
  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    throw new ValidationError("Invalid user ID", "userId");
  }
}

function validatePlan(plan: string): void {
  const validPlans = ["free", "premium"];
  if (!plan || !validPlans.includes(plan)) {
    throw new ValidationError(`Invalid plan: ${plan}`, "plan");
  }
}

function validateSubscription(subscription: Stripe.Subscription): void {
  if (!subscription.id) {
    throw new ValidationError("Subscription ID is required", "subscription.id");
  }
  
  if (!subscription.customer) {
    throw new ValidationError("Subscription customer is required", "subscription.customer");
  }
  
  if (!subscription.items || !subscription.items.data || subscription.items.data.length === 0) {
    throw new ValidationError("Subscription must have at least one item", "subscription.items");
  }
}

// Retry utility with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "cancelled";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
      return "inactive";
    default:
      return "inactive";
  }
}

export async function upsertSubscriptionFromStripe(options: {
  subscription: Stripe.Subscription;
  userId: string;
  plan: string;
}): Promise<void> {
  try {
    const { subscription, userId, plan } = options;

    validateUserId(userId);
    validateSubscription(subscription);

    const resolvedPlan = inferPlan(subscription, plan);
    validatePlan(resolvedPlan);

    const price = subscription.items.data[0]?.price ?? null;
    const customerId = typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

    if (!customerId) {
      throw new ValidationError("Customer ID is required", "stripeCustomerId");
    }

    const subscriptionRef = db.collection("subscriptions").doc(subscription.id);

    const currentPeriodStartTs = stripeSecondsToTimestamp((subscription as Stripe.Subscription & { current_period_start?: number }).current_period_start);
    const currentPeriodEndTs = stripeSecondsToTimestamp((subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end);
    const createdTs = stripeSecondsToTimestamp(subscription.created ?? null);
    const cancelAtTs = stripeSecondsToTimestamp(subscription.cancel_at ?? null);
    const canceledAtTs = stripeSecondsToTimestamp(subscription.canceled_at ?? null);
    const endedAtTs = stripeSecondsToTimestamp(subscription.ended_at ?? null);
    const trialStartTs = stripeSecondsToTimestamp(subscription.trial_start ?? null);
    const trialEndTs = stripeSecondsToTimestamp(subscription.trial_end ?? null);
    const { id: latestInvoiceId, status: latestInvoiceStatus } = resolveLatestInvoiceInfo(subscription.latest_invoice);

    const billingCycle = inferBillingCycle(subscription);
    const subscriptionStatus = mapStripeStatus(subscription.status);

    // Effective plan should reflect whether the subscription is currently usable.
    // This keeps UI + server enforcement consistent (e.g. past_due/cancelled should not be treated as premium).
    const effectiveUserPlan: SubscriptionPlan = subscriptionStatus === "active" ? resolvedPlan : "free";

    // Use retry logic for database operations
    await withRetry(async () => {
      await db.runTransaction(async (txn) => {
        const snapshot = await txn.get(subscriptionRef);
        const data: Record<string, unknown> = {
          userId,
          plan: resolvedPlan,
          status: subscriptionStatus,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
          billingCycle,
          price: price?.unit_amount ? price.unit_amount / 100 : null,
          currency: price?.currency ?? null,
          collectionMethod: subscription.collection_method ?? null,
          cancelAt: cancelAtTs,
          canceledAt: canceledAtTs,
          endedAt: endedAtTs,
          trialStart: trialStartTs,
          trialEnd: trialEndTs,
          latestInvoiceId,
          latestInvoiceStatus,
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (currentPeriodStartTs) {
          data.currentPeriodStart = currentPeriodStartTs;
        } else if (!snapshot.exists) {
          data.currentPeriodStart = FieldValue.serverTimestamp();
        }

        if (currentPeriodEndTs) {
          data.currentPeriodEnd = currentPeriodEndTs;
        } else if (!snapshot.exists) {
          data.currentPeriodEnd = FieldValue.serverTimestamp();
        }

        if (!snapshot.exists) {
          data.createdAt = createdTs ?? FieldValue.serverTimestamp();
        }

        const portalUrl = subscription.metadata?.customerPortalUrl;
        if (portalUrl) {
          data.customerPortalUrl = portalUrl;
        } else if (!snapshot.exists) {
          data.customerPortalUrl = null;
        }

        txn.set(subscriptionRef, data, { merge: true });
      });
    });

    // Update user record with retry logic
    await withRetry(async () => {
      const userRef = db.collection("users").doc(userId);
      await userRef.set(
        {
          subscriptionId: subscription.id,
          stripeCustomerId: customerId,
          // plan = effective plan used for gating in many places
          plan: effectiveUserPlan,
          // subscriptionPlan = the user's actual subscribed tier (useful for analytics/admin views)
          subscriptionPlan: resolvedPlan,
          subscriptionStatus,
          subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
          subscriptionTrialEndsAt: trialEndTs ?? null,
          billingCycle,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

  } catch (error) {
    if (error instanceof SubscriptionError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw new DatabaseError(
        `Failed to upsert subscription: ${error.message}`,
        "upsertSubscription",
        error
      );
    }
    
    throw new DatabaseError(
      `Failed to upsert subscription: Unknown error`,
      "upsertSubscription"
    );
  }
}

// Additional utility functions for subscription management

export async function getSubscriptionByUserId(userId: string): Promise<Stripe.Subscription | null> {
  try {
    validateUserId(userId);
    
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData?.subscriptionId) {
      return null;
    }
    
    const subscriptionDoc = await db.collection("subscriptions").doc(userData.subscriptionId).get();
    if (!subscriptionDoc.exists) {
      return null;
    }
    
    const subscriptionData = subscriptionDoc.data();
    if (!subscriptionData?.stripeSubscriptionId) {
      return null;
    }
    
    // Note: This would require Stripe client - consider moving to a different location
    // or passing Stripe client as parameter
    return null;
    
  } catch (error) {
    if (error instanceof SubscriptionError) {
      throw error;
    }
    
    throw new DatabaseError(
      `Failed to get subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
      "getSubscriptionByUserId",
      error instanceof Error ? error : undefined
    );
  }
}

export async function cancelSubscriptionInDatabase(subscriptionId: string, userId: string): Promise<void> {
  try {
    validateUserId(userId);
    
    if (!subscriptionId || typeof subscriptionId !== "string") {
      throw new ValidationError("Invalid subscription ID", "subscriptionId");
    }
    
    await withRetry(async () => {
      const subscriptionRef = db.collection("subscriptions").doc(subscriptionId);
      await subscriptionRef.update({
        cancelAtPeriodEnd: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    
  } catch (error) {
    if (error instanceof SubscriptionError) {
      throw error;
    }
    
    throw new DatabaseError(
      `Failed to cancel subscription in database: ${error instanceof Error ? error.message : 'Unknown error'}`,
      "cancelSubscriptionInDatabase",
      error instanceof Error ? error : undefined
    );
  }
}

export async function reactivateSubscriptionInDatabase(subscriptionId: string, userId: string): Promise<void> {
  try {
    validateUserId(userId);
    
    if (!subscriptionId || typeof subscriptionId !== "string") {
      throw new ValidationError("Invalid subscription ID", "subscriptionId");
    }
    
    await withRetry(async () => {
      const subscriptionRef = db.collection("subscriptions").doc(subscriptionId);
      await subscriptionRef.update({
        cancelAtPeriodEnd: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    
  } catch (error) {
    if (error instanceof SubscriptionError) {
      throw error;
    }
    
    throw new DatabaseError(
      `Failed to reactivate subscription in database: ${error instanceof Error ? error.message : 'Unknown error'}`,
      "reactivateSubscriptionInDatabase",
      error instanceof Error ? error : undefined
    );
  }
}
