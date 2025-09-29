import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb } from "@/firebase/admin";
import * as admin from "firebase-admin";
import { SUBSCRIPTION_LIMITS, Subscription, SubscriptionPlan } from "@/types/api";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

// GET /api/subscription/status - Get current subscription status
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // Get user record
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as Record<string, any> | undefined;

    let subscription: Subscription | null = null;
    let plan: SubscriptionPlan = "free";

    if (userData?.subscriptionId) {
      const subscriptionDoc = await db.collection("subscriptions").doc(userData.subscriptionId).get();

      if (subscriptionDoc.exists) {
        const data = subscriptionDoc.data() as Record<string, any> | undefined;

        if (data) {
          const toMillis = (value: admin.firestore.Timestamp | number | null | undefined) => {
            if (value instanceof admin.firestore.Timestamp) {
              return value.toMillis();
            }
            return typeof value === "number" ? value : null;
          };

          subscription = {
            _id: subscriptionDoc.id,
            userId: data.userId ?? userId,
            plan: (data.plan ?? "premium") as SubscriptionPlan,
            status: data.status ?? "inactive",
            currentPeriodStart: toMillis(data.currentPeriodStart ?? null),
            currentPeriodEnd: toMillis(data.currentPeriodEnd ?? null),
            cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
            createdAt: toMillis(data.createdAt ?? null),
            updatedAt: toMillis(data.updatedAt ?? null),
            stripeSubscriptionId: data.stripeSubscriptionId ?? undefined,
            stripeCustomerId: data.stripeCustomerId ?? undefined,
            billingCycle: data.billingCycle ?? null,
            price: typeof data.price === "number" ? data.price : null,
            currency: data.currency ?? null,
            customerPortalUrl: data.customerPortalUrl ?? null,
          };

          if (subscription.plan in SUBSCRIPTION_LIMITS) {
            plan = subscription.plan;
          }
        }
      }
    }

    if (!subscription && typeof userData?.plan === "string" && userData.plan in SUBSCRIPTION_LIMITS) {
      plan = userData.plan as SubscriptionPlan;
    }

    const limits = SUBSCRIPTION_LIMITS[plan] ?? SUBSCRIPTION_LIMITS.free;

    // Get current usage for this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // CV analyses usage
    const cvAnalysesQuery = await db.collection("cvAnalyses")
      .where("userId", "==", userId)
      .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startOfMonth))
      .get();

    // Application usage (simplified - just count total for now)
    const applicationsQuery = await db.collection("applications")
      .where("userId", "==", userId)
      .get();

    const currentUsage = {
      cvAnalyses: cvAnalysesQuery.size,
      applications: applicationsQuery.size,
    };

    const customerPortalUrl = subscription?.customerPortalUrl ?? userData?.stripeCustomerPortalUrl ?? null;
    const checkoutUrl = userData?.pendingCheckoutUrl ?? null;
    const cancelUrl = subscription ? "/api/subscription/cancel" : null;
    const resumeUrl = subscription?.cancelAtPeriodEnd ? "/api/subscription/resume" : null;

    return NextResponse.json({
      subscription,
      plan,
      limits,
      currentUsage,
      actions: {
        customerPortalUrl,
        checkoutUrl,
        cancelUrl,
        resumeUrl,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
