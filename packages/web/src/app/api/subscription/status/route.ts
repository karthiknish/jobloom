import { withApi, z } from "@/lib/api/withApi";
import { getAdminDb, Timestamp } from "@/firebase/admin";
import { SUBSCRIPTION_LIMITS, Subscription, SubscriptionPlan } from "@/types/api";

export const runtime = "nodejs";

export const GET = withApi({
  auth: 'required',
  rateLimit: 'subscription',
}, async ({ user }) => {
  const db = getAdminDb();
  const userId = user!.uid;

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
        const toMillis = (value: Timestamp | number | null | undefined) => {
          if (value instanceof Timestamp) {
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
          trialStart: toMillis(data.trialStart ?? null),
          trialEnd: toMillis(data.trialEnd ?? null),
          cancelAt: toMillis(data.cancelAt ?? null),
          canceledAt: toMillis(data.canceledAt ?? null),
          endedAt: toMillis(data.endedAt ?? null),
          latestInvoiceId: data.latestInvoiceId ?? null,
          latestInvoiceStatus: data.latestInvoiceStatus ?? null,
          collectionMethod: data.collectionMethod ?? null,
        };

        const isActive = subscription.status === "active";
        if (isActive && subscription.plan in SUBSCRIPTION_LIMITS) {
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

  let cvAnalysesCount = 0;
  let applicationsCount = 0;

  // CV analyses usage
  try {
    const cvAnalysesQuery = await db.collection("cvAnalyses")
      .where("userId", "==", userId)
      .where("createdAt", ">=", Timestamp.fromDate(startOfMonth))
      .get();
    cvAnalysesCount = cvAnalysesQuery.size;
  } catch (indexError: any) {
    if (indexError?.code === 9) {
      try {
        const allCvAnalyses = await db.collection("cvAnalyses")
          .where("userId", "==", userId)
          .get();
        const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);
        cvAnalysesCount = allCvAnalyses.docs.filter(doc => {
          const createdAt = doc.data().createdAt;
          return createdAt && createdAt >= startOfMonthTimestamp;
        }).length;
      } catch {
        cvAnalysesCount = 0;
      }
    } else {
      cvAnalysesCount = 0;
    }
  }

  // Application usage
  try {
    const applicationsQuery = await db.collection("applications")
      .where("userId", "==", userId)
      .get();
    applicationsCount = applicationsQuery.size;
  } catch {
    applicationsCount = 0;
  }

  const currentUsage = {
    cvAnalyses: cvAnalysesCount,
    applications: applicationsCount,
  };

  const customerPortalUrl = subscription?.customerPortalUrl ?? userData?.stripeCustomerPortalUrl ?? null;
  const checkoutUrl = userData?.pendingCheckoutUrl ?? null;
  const cancelUrl = subscription ? "/api/subscription/cancel" : null;
  const resumeUrl = subscription?.cancelAtPeriodEnd ? "/api/subscription/resume" : null;

  return {
    subscription,
    plan,
    limits,
    currentUsage,
    isAdmin: user!.isAdmin,
    actions: {
      customerPortalUrl,
      checkoutUrl,
      cancelUrl,
      resumeUrl,
    },
  };
});

export { OPTIONS } from "@/lib/api/withApi";
