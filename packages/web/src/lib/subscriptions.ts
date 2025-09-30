import Stripe from "stripe";
import { getAdminDb } from "@/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "past_due";

const db = getAdminDb();

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
    default:
      return "inactive";
  }
}

function detectBillingCycle(subscription: Stripe.Subscription): "monthly" {
  return "monthly";
}

export async function upsertSubscriptionFromStripe(options: {
  subscription: Stripe.Subscription;
  userId: string;
  plan: string;
}): Promise<void> {
  try {
    const { subscription, userId, plan } = options;
    
    // Validate inputs
    validateUserId(userId);
    validatePlan(plan);
    validateSubscription(subscription);
    
    const price = subscription.items.data[0]?.price;
    const customerId = typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

    if (!customerId) {
      throw new ValidationError("Customer ID is required", "stripeCustomerId");
    }

    const subscriptionRef = db.collection("subscriptions").doc(subscription.id);

    const periodStartSeconds = (subscription as Stripe.Subscription & { current_period_start?: number })["current_period_start"];
    const periodEndSeconds = (subscription as Stripe.Subscription & { current_period_end?: number })["current_period_end"];

    // Use retry logic for database operations
    await withRetry(async () => {
      await db.runTransaction(async (txn) => {
        const snapshot = await txn.get(subscriptionRef);
        const data: Record<string, unknown> = {
          userId,
          plan,
          status: mapStripeStatus(subscription.status),
          currentPeriodStart: periodStartSeconds
            ? Timestamp.fromMillis(periodStartSeconds * 1000)
            : FieldValue.serverTimestamp(),
          currentPeriodEnd: periodEndSeconds
            ? Timestamp.fromMillis(periodEndSeconds * 1000)
            : FieldValue.serverTimestamp(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
          billingCycle: detectBillingCycle(subscription),
          price: price?.unit_amount ? price.unit_amount / 100 : null,
          currency: price?.currency ?? null,
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (!snapshot.exists) {
          data.createdAt = FieldValue.serverTimestamp();
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
          plan,
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
