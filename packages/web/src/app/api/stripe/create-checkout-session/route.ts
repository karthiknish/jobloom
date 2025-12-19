import { NextRequest, NextResponse } from "next/server";
import { getStripeClient, getPriceIdForPlan, getStripeSuccessUrl, getStripeCancelUrl } from "@/lib/stripe";
import { getAdminDb, FieldValue, Timestamp, type Firestore } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { z } from "zod";

const db: Firestore = getAdminDb();

const checkoutBodySchema = z.object({
  plan: z.literal("premium"),
  billingCycle: z.enum(["monthly", "annual"]).optional(),
});

export const POST = withApi({
  auth: "required",
  bodySchema: checkoutBodySchema,
}, async ({ request, body, user }) => {
  // In development with mock tokens, return mock checkout session for testing
  const isMockToken = process.env.NODE_ENV === "development" &&
    request.headers.get("authorization")?.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

  if (isMockToken) {
    return {
      sessionId: 'cs_test_mock_session_123',
      url: 'https://checkout.stripe.com/test-session',
      message: 'Checkout session created successfully (mock)'
    };
  }

  const userId = user!.uid;
  const { plan } = body;

  const origin =
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";

  const stripe = getStripeClient();
  const priceId = getPriceIdForPlan(plan);

  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.data() as
    | { email?: string; stripeCustomerId?: string; subscriptionId?: string }
    | undefined;

  if (!userData) {
    throw new Error("User not found");
  }

  // If the user already has an active subscription, don't create another checkout session.
  const existingSubscriptionId = userData?.subscriptionId;
  if (existingSubscriptionId) {
    try {
      const subDoc = await db.collection("subscriptions").doc(existingSubscriptionId).get();
      const subData = subDoc.data() as any;

      if (subData?.status === "active") {
        throw new Error(subData?.cancelAtPeriodEnd
          ? "You already have an active subscription that is set to cancel. You can resume it from settings."
          : "You already have an active subscription.");
      }

      if (subData?.status === "past_due" || subData?.status === "inactive") {
        throw new Error("Your subscription needs attention (payment or status issue). Please use the billing portal.");
      }
    } catch (e: any) {
      // If we can't read subscription state, proceed to create session (best-effort).
      if (e.message.includes("subscription")) throw e;
    }
  }

  let stripeCustomerId = userData.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: userData.email || user!.email || undefined,
      metadata: {
        firebaseUserId: userId,
      },
    });

    stripeCustomerId = customer.id;

    await userRef.set(
      {
        stripeCustomerId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: getStripeSuccessUrl(origin),
    cancel_url: getStripeCancelUrl(origin),
    customer: stripeCustomerId,
    billing_address_collection: "required",
    allow_promotion_codes: true,
    client_reference_id: userId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        userId,
        plan,
      },
    },
    metadata: {
      userId,
      plan,
    },
  });

  await db.collection("subscriptionCheckouts").doc(session.id).set({
    userId,
    plan,
    stripeCustomerId,
    createdAt: Timestamp.now(),
    status: "created",
  });

  return {
    url: session.url,
    sessionId: session.id,
  };
});
