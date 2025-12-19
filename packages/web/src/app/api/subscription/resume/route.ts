import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { getStripeClient } from "@/lib/stripe";
import { upsertSubscriptionFromStripe } from "@/lib/subscriptions";
import { FieldValue } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import type Stripe from "stripe";

// Lazy initialization - called inside handlers
function getStripe() { return getStripeClient(); }
function getDb() { return getAdminDb(); }

type SubscriptionWithLegacyPeriods = Stripe.Subscription & {
  current_period_end?: number | null;
};

const resolveCurrentPeriodEnd = (
  subscription: Stripe.Subscription
): number | null => {
  const legacy = subscription as SubscriptionWithLegacyPeriods;
  return typeof legacy.current_period_end === "number"
    ? legacy.current_period_end * 1000
    : null;
};

export const POST = withApi({
  auth: "required",
  rateLimit: "subscription",
}, async ({ user }) => {
  const userId = user!.uid;
  const db = getDb();

  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.data() as Record<string, any> | undefined;

  const subscriptionId = userData?.subscriptionId;

  if (!subscriptionId) {
    throw new Error("No active subscription found for this user");
  }

  const stripeSubscriptionResponse = await getStripe().subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice.payment_intent"],
  });
  const stripeSubscription = stripeSubscriptionResponse as Stripe.Subscription;

  if (!stripeSubscription.cancel_at_period_end) {
    return {
      subscription: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        currentPeriodEnd: resolveCurrentPeriodEnd(stripeSubscription),
      },
      message: "Subscription is not set to cancel",
    };
  }

  const updatedSubscriptionResponse = await getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
  const updatedSubscription = updatedSubscriptionResponse as Stripe.Subscription;

  await upsertSubscriptionFromStripe({
    subscription: updatedSubscription,
    userId,
    plan: (updatedSubscription.metadata?.plan ?? userData?.plan ?? "premium") as string,
  });

  await db.collection("users").doc(userId).set({
    subscriptionId: updatedSubscription.id,
    stripeCustomerId: updatedSubscription.customer as string,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    subscription: {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      currentPeriodEnd: resolveCurrentPeriodEnd(updatedSubscription),
    },
  };
});

