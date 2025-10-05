import { getAdminDb, FieldValue, Timestamp } from "@/firebase/admin";
import { getStripeClient } from "@/lib/stripe";
import { upsertSubscriptionFromStripe, ValidationError, DatabaseError } from "@/lib/subscriptions";
import Stripe from "stripe";

const db = getAdminDb();
const stripe = getStripeClient();

// Monitoring configuration
const MONITORING_CONFIG = {
  checkInterval: 5 * 60 * 1000, // 5 minutes
  maxRetries: 3,
  retryDelay: 1000,
  staleThreshold: 24 * 60 * 60 * 1000, // 24 hours
  paymentFailureThreshold: 3, // Number of failed payments before action
};

// Health check status types
export type HealthStatus = "healthy" | "warning" | "critical" | "unknown";

export interface SubscriptionHealth {
  subscriptionId: string;
  userId: string;
  status: HealthStatus;
  lastChecked: number;
  issues: string[];
  metrics: {
    stripeSyncStatus: "synced" | "out_of_sync" | "error";
    lastPaymentStatus: "success" | "failed" | "pending" | "none";
    daysUntilExpiry: number;
    consecutiveFailures: number;
  };
}

export interface SystemHealth {
  overallStatus: HealthStatus;
  totalSubscriptions: number;
  healthySubscriptions: number;
  warningSubscriptions: number;
  criticalSubscriptions: number;
  lastCheckTime: number;
  issues: string[];
}

// Health check functions
export async function checkSubscriptionHealth(subscriptionId: string): Promise<SubscriptionHealth> {
  try {
    // Get subscription from database
    const subscriptionDoc = await db.collection("subscriptions").doc(subscriptionId).get();
    if (!subscriptionDoc.exists) {
      throw new Error(`Subscription ${subscriptionId} not found in database`);
    }

    const subscriptionData = subscriptionDoc.data();
    const userId = subscriptionData?.userId;

    if (!userId) {
      throw new Error(`Subscription ${subscriptionId} has no associated user`);
    }

    // Get subscription from Stripe
    let stripeSubscription: Stripe.Subscription | null = null;
    let stripeSyncStatus: "synced" | "out_of_sync" | "error" = "error";
    const issues: string[] = [];

    try {
      stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      stripeSyncStatus = "synced";
    } catch (error) {
      issues.push("Failed to retrieve subscription from Stripe");
      stripeSyncStatus = "error";
    }

    // Compare database and Stripe data
    if (stripeSubscription && subscriptionData) {
      const dbStatus = subscriptionData.status;
      const stripeStatus = mapStripeStatus(stripeSubscription.status);
      
      if (dbStatus !== stripeStatus) {
        issues.push(`Status mismatch: DB=${dbStatus}, Stripe=${stripeStatus}`);
        stripeSyncStatus = "out_of_sync";
      }

      const dbCancelAtEnd = subscriptionData.cancelAtPeriodEnd;
      const stripeCancelAtEnd = stripeSubscription.cancel_at_period_end;
      
      if (dbCancelAtEnd !== stripeCancelAtEnd) {
        issues.push(`Cancel at period end mismatch: DB=${dbCancelAtEnd}, Stripe=${stripeCancelAtEnd}`);
        stripeSyncStatus = "out_of_sync";
      }
    }

    // Calculate health status
    let status: HealthStatus = "healthy";
    const metrics = {
      stripeSyncStatus,
      lastPaymentStatus: subscriptionData?.lastPaymentStatus || "none",
      daysUntilExpiry: 0,
      consecutiveFailures: subscriptionData?.consecutiveFailures || 0,
    };

    // Calculate days until expiry
    if (subscriptionData?.currentPeriodEnd) {
      const periodEnd = subscriptionData.currentPeriodEnd.toMillis();
      const now = Date.now();
      metrics.daysUntilExpiry = Math.max(0, Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)));
    }

    // Determine health status
    if (issues.length > 0) {
      status = "warning";
    }

    if (stripeSyncStatus === "error") {
      status = "critical";
    }

    if (metrics.consecutiveFailures >= MONITORING_CONFIG.paymentFailureThreshold) {
      status = "critical";
      issues.push("Multiple consecutive payment failures");
    }

    if (metrics.daysUntilExpiry <= 3 && metrics.daysUntilExpiry > 0) {
      status = "warning";
      issues.push(`Subscription expires in ${metrics.daysUntilExpiry} days`);
    }

    if (metrics.daysUntilExpiry === 0 && subscriptionData?.status === "active") {
      status = "critical";
      issues.push("Subscription has expired");
    }

    return {
      subscriptionId,
      userId,
      status,
      lastChecked: Date.now(),
      issues,
      metrics,
    };

  } catch (error) {
    console.error(`Error checking subscription health for ${subscriptionId}:`, error);
    
    return {
      subscriptionId,
      userId: "unknown",
      status: "critical",
      lastChecked: Date.now(),
      issues: [error instanceof Error ? error.message : "Unknown error"],
      metrics: {
        stripeSyncStatus: "error",
        lastPaymentStatus: "none",
        daysUntilExpiry: 0,
        consecutiveFailures: 0,
      },
    };
  }
}

export async function checkSystemHealth(): Promise<SystemHealth> {
  try {
    const subscriptionsQuery = await db.collection("subscriptions").get();
    const subscriptions = subscriptionsQuery.docs;

    let healthyCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    const allIssues: string[] = [];

    // Check a sample of subscriptions for system health
    const sampleSize = Math.min(50, subscriptions.length);
    const sampleSubscriptions = subscriptions.slice(0, sampleSize);

    for (const doc of sampleSubscriptions) {
      try {
        const health = await checkSubscriptionHealth(doc.id);
        
        switch (health.status) {
          case "healthy":
            healthyCount++;
            break;
          case "warning":
            warningCount++;
            allIssues.push(...health.issues);
            break;
          case "critical":
            criticalCount++;
            allIssues.push(...health.issues);
            break;
        }
      } catch (error) {
        criticalCount++;
        allIssues.push(`Failed to check subscription ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Determine overall system status
    let overallStatus: HealthStatus = "healthy";
    if (criticalCount > 0) {
      overallStatus = "critical";
    } else if (warningCount > 0) {
      overallStatus = "warning";
    }

    return {
      overallStatus,
      totalSubscriptions: subscriptions.length,
      healthySubscriptions: healthyCount,
      warningSubscriptions: warningCount,
      criticalSubscriptions: criticalCount,
      lastCheckTime: Date.now(),
      issues: [...new Set(allIssues)], // Remove duplicates
    };

  } catch (error) {
    console.error("Error checking system health:", error);
    
    return {
      overallStatus: "critical",
      totalSubscriptions: 0,
      healthySubscriptions: 0,
      warningSubscriptions: 0,
      criticalSubscriptions: 0,
      lastCheckTime: Date.now(),
      issues: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

// Recovery mechanisms
export async function recoverSubscription(subscriptionId: string): Promise<boolean> {
  try {
    console.log(`Attempting to recover subscription ${subscriptionId}`);
    
    // Get current database state
    const subscriptionDoc = await db.collection("subscriptions").doc(subscriptionId).get();
    if (!subscriptionDoc.exists) {
      console.error(`Subscription ${subscriptionId} not found in database`);
      return false;
    }

    const subscriptionData = subscriptionDoc.data();
    const userId = subscriptionData?.userId;

    if (!userId) {
      console.error(`Subscription ${subscriptionId} has no associated user`);
      return false;
    }

    // Get fresh data from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Sync with database
    await upsertSubscriptionFromStripe({
      subscription: stripeSubscription,
      userId,
      plan: stripeSubscription.metadata?.plan ?? subscriptionData?.plan ?? "premium",
    });

    // Log recovery
    await db.collection("subscriptionRecoveryLogs").add({
      subscriptionId,
      userId,
      recoveryTime: FieldValue.serverTimestamp(),
      oldStatus: subscriptionData?.status,
      newStatus: mapStripeStatus(stripeSubscription.status),
      success: true,
    });

    console.log(`Successfully recovered subscription ${subscriptionId}`);
    return true;

  } catch (error) {
    console.error(`Failed to recover subscription ${subscriptionId}:`, error);
    
    // Log failed recovery
    try {
      await db.collection("subscriptionRecoveryLogs").add({
        subscriptionId,
        userId: "unknown",
        recoveryTime: FieldValue.serverTimestamp(),
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      });
    } catch (logError) {
      console.error("Failed to log recovery attempt:", logError);
    }

    return false;
  }
}

// Automated recovery for stale subscriptions
export async function recoverStaleSubscriptions(): Promise<{ recovered: number; failed: number }> {
  try {
    const staleThreshold = Date.now() - MONITORING_CONFIG.staleThreshold;
    
    const staleQuery = await db.collection("subscriptions")
      .where("updatedAt", "<", Timestamp.fromMillis(staleThreshold))
      .where("status", "==", "active")
      .get();

    let recovered = 0;
    let failed = 0;

    for (const doc of staleQuery.docs) {
      try {
        const success = await recoverSubscription(doc.id);
        if (success) {
          recovered++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error recovering subscription ${doc.id}:`, error);
        failed++;
      }
    }

    console.log(`Stale subscription recovery completed: ${recovered} recovered, ${failed} failed`);
    return { recovered, failed };

  } catch (error) {
    console.error("Error in stale subscription recovery:", error);
    return { recovered: 0, failed: 0 };
  }
}

// Helper function to map Stripe status
function mapStripeStatus(status: Stripe.Subscription.Status): string {
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

// Start monitoring service (for production deployment)
export function startSubscriptionMonitoring(): void {
  console.log("Starting subscription monitoring service");
  
  // Run health checks periodically
  setInterval(async () => {
    try {
      const systemHealth = await checkSystemHealth();
      console.log("System health check completed:", systemHealth);
      
      // Store health check results
      await db.collection("systemHealthLogs").add({
        ...systemHealth,
        timestamp: FieldValue.serverTimestamp(),
      });

      // Trigger recovery for critical issues
      if (systemHealth.overallStatus === "critical") {
        console.log("Critical system health detected, attempting recovery...");
        await recoverStaleSubscriptions();
      }

    } catch (error) {
      console.error("Error in subscription monitoring:", error);
    }
  }, MONITORING_CONFIG.checkInterval);

  console.log(`Subscription monitoring started with ${MONITORING_CONFIG.checkInterval}ms interval`);
}