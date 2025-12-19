import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { getStripeClient } from "@/lib/stripe";
import Stripe from "stripe";
import { upsertSubscriptionFromStripe } from "@/lib/subscriptions";
import { FieldValue } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";

// Lazy initialization - called inside handlers
function getStripe() { return getStripeClient(); }
function getDb() { return getAdminDb(); }

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

  const stripeSubscription = (await getStripe().subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice.payment_intent"],
  })) as Stripe.Subscription;

  const getCurrentPeriodEnd = (subscription: Stripe.Subscription): number | null => {
    const value = (subscription as Stripe.Subscription & { current_period_end?: number | null }).current_period_end;
    return typeof value === "number" ? value * 1000 : null;
  };

  if (stripeSubscription.cancel_at_period_end) {
    const currentPeriodEndMillis = getCurrentPeriodEnd(stripeSubscription);
    return {
      subscription: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        currentPeriodEnd: currentPeriodEndMillis,
      },
      message: "Subscription is already scheduled to cancel at period end",
    };
  }

  const updatedSubscription = (await getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })) as Stripe.Subscription;

  const updatedPeriodEndMillis = getCurrentPeriodEnd(updatedSubscription);

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
      currentPeriodEnd: updatedPeriodEndMillis,
    },
  };
});

