import Stripe from "stripe";
import { getAdminDb } from "@/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "past_due";

const db = getAdminDb();

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

function detectBillingCycle(subscription: Stripe.Subscription): "monthly" | "yearly" {
  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  if (interval === "year") return "yearly";
  return "monthly";
}

export async function upsertSubscriptionFromStripe(options: {
  subscription: Stripe.Subscription;
  userId: string;
  plan: string;
  billingCycle?: string | null;
}) {
  const { subscription, userId, plan, billingCycle } = options;
  const price = subscription.items.data[0]?.price;
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer?.id;

  const subscriptionRef = db.collection("subscriptions").doc(subscription.id);

  const periodStartSeconds = (subscription as Stripe.Subscription & { current_period_start?: number })["current_period_start"];
  const periodEndSeconds = (subscription as Stripe.Subscription & { current_period_end?: number })["current_period_end"];

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
      billingCycle: billingCycle ?? detectBillingCycle(subscription),
      price: price?.unit_amount ? price.unit_amount / 100 : null,
      currency: price?.currency ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!snapshot.exists) {
      data.createdAt = FieldValue.serverTimestamp();
    }

    txn.set(subscriptionRef, data, { merge: true });
  });

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
}
