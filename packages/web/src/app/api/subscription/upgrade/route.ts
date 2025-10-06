import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";
import { getStripeClient } from "@/lib/stripe";
import { upsertSubscriptionFromStripe } from "@/lib/subscriptions";

const stripe = getStripeClient();

interface UpgradeRequestBody {
  sessionId?: string;
}

// POST /api/subscription/upgrade - Confirm subscription upgrade after successful checkout
export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifySessionFromRequest(request);

    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In development with mock tokens, return mock upgrade response for testing
    const isMockToken = process.env.NODE_ENV === "development" &&
      request.headers.get("authorization")?.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    if (isMockToken) {
      return NextResponse.json({
        success: true,
        message: 'Subscription upgraded successfully (mock)',
        plan: 'premium'
      });
    }

    const { sessionId } = (await request.json()) as UpgradeRequestBody;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing Stripe session ID" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Checkout session not found" }, { status: 404 });
    }

    const userId = decodedToken.uid;

    const sessionUserId = session.metadata?.userId || session.client_reference_id;
    if (!sessionUserId || sessionUserId !== userId) {
      return NextResponse.json({ error: "Session does not belong to this user" }, { status: 403 });
    }

    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "No subscription information available for this session" },
        { status: 400 }
      );
    }

    const plan = session.metadata?.plan ?? "premium";
    const billingCycle = session.metadata?.billingCycle ?? undefined;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await upsertSubscriptionFromStripe({
      subscription,
      userId,
      plan,
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
      },
    });
  } catch (error) {
    console.error("Error confirming subscription upgrade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
