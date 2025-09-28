import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { getAdminDb } from "@/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { upsertSubscriptionFromStripe } from "@/lib/subscriptions";

export const runtime = "nodejs";

const stripe = getStripeClient();
const db = getAdminDb();

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription?.id;
  const userId = session.metadata?.userId || session.client_reference_id;
  const plan = session.metadata?.plan ?? "premium";
  const billingCycle = session.metadata?.billingCycle ?? null;

  if (!subscriptionId || !userId) {
    console.warn("Checkout session missing necessary metadata", {
      subscriptionId,
      userId,
    });
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await upsertSubscriptionFromStripe({
    subscription,
    userId,
    plan,
    billingCycle,
  });

  await db.collection("subscriptionCheckouts").doc(session.id).set(
    {
      status: "completed",
      subscriptionId,
      completedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const plan = subscription.metadata?.plan ?? "premium";
  const billingCycle = subscription.metadata?.billingCycle ?? undefined;

  if (!userId) {
    console.warn("Stripe subscription missing user metadata", {
      subscriptionId: subscription.id,
    });
    return;
  }

  await upsertSubscriptionFromStripe({
    subscription,
    userId,
    plan,
    billingCycle,
  });
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Stripe webhook secret is not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  const rawBody = await request.text();

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown signature verification error";
    console.error("Failed to verify Stripe webhook signature:", errorMessage);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      default: {
        // Ignore unrelated events but acknowledge receipt
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown webhook handling error";
    console.error("Error handling Stripe webhook: ", errorMessage, {
      eventType: event.type,
    });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
