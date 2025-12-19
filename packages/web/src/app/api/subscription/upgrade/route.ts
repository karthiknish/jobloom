import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { upsertSubscriptionFromStripe } from "@/lib/subscriptions";
import { withApi, z } from "@/lib/api/withApi";

// Lazy initialization - called inside handlers
function getStripe() { return getStripeClient(); }

const upgradeRequestBodySchema = z.object({
  sessionId: z.string(),
});

// POST /api/subscription/upgrade - Confirm subscription upgrade after successful checkout
export const POST = withApi({
  auth: "required",
  bodySchema: upgradeRequestBodySchema,
}, async ({ user, body }) => {
  const { sessionId } = body;
  const userId = user!.uid;

  const session = await getStripe().checkout.sessions.retrieve(sessionId);

  if (!session) {
    throw new Error("Checkout session not found");
  }

  const sessionUserId = session.metadata?.userId || session.client_reference_id;
  if (!sessionUserId || sessionUserId !== userId) {
    // We can return a custom NextResponse for specific status codes if needed,
    // but withApi handles generic errors. For 403, we might want to throw a specific error
    // or return a NextResponse.
    return NextResponse.json({ error: "Session does not belong to this user" }, { status: 403 });
  }

  // Ensure checkout is actually completed and paid before we persist entitlement.
  // For subscriptions, Stripe typically sets session.status='complete' and payment_status='paid'.
  if (session.status !== "complete") {
    return NextResponse.json({ error: "Checkout session is not complete" }, { status: 409 });
  }

  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return NextResponse.json({ error: "Payment not confirmed for this checkout session" }, { status: 409 });
  }

  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription?.id;

  if (!subscriptionId) {
    throw new Error("No subscription information available for this session");
  }

  const planFromMetadata = session.metadata?.plan ?? "premium";
  if (planFromMetadata !== "premium") {
    throw new Error("Invalid plan in checkout session metadata");
  }

  const plan = "premium";

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

  await upsertSubscriptionFromStripe({
    subscription,
    userId,
    plan,
  });

  return {
    subscription: {
      id: subscription.id,
      status: subscription.status,
    },
  };
});
