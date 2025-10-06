import { NextRequest, NextResponse } from "next/server";
import { getStripeClient, getPriceIdForPlan, getStripeSuccessUrl, getStripeCancelUrl } from "@/lib/stripe";
import { verifyIdToken, getAdminDb, FieldValue, Timestamp, type Firestore } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";

const db: Firestore = getAdminDb();

interface CheckoutRequestBody {
  plan: "premium";
}

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifySessionFromRequest(request);

    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In development with mock tokens, return mock checkout session for testing
    const isMockToken = process.env.NODE_ENV === "development" &&
      request.headers.get("authorization")?.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    if (isMockToken) {
      return NextResponse.json({
        sessionId: 'cs_test_mock_session_123',
        url: 'https://checkout.stripe.com/test-session',
        message: 'Checkout session created successfully (mock)'
      });
    }

    const userId = decodedToken.uid;
    const body = (await request.json()) as CheckoutRequestBody;
    const plan = body.plan;

    if (plan !== "premium") {
      return NextResponse.json(
        { error: "Invalid plan. Only 'premium' is currently supported." },
        { status: 400 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      "http://localhost:3000";

    const stripe = getStripeClient();
    const priceId = getPriceIdForPlan(plan);

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data() as { email?: string; stripeCustomerId?: string } | undefined;

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let stripeCustomerId = userData.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userData.email || decodedToken.email || undefined,
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

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
