import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { getStripeClient } from "@/lib/stripe";
import { upsertSubscriptionFromStripe } from "@/lib/subscriptions";

// Lazy initialization - called inside handlers
function getStripe() { return getStripeClient(); }

interface UpgradeRequestBody {
  sessionId?: string;
}

// POST /api/subscription/upgrade - Confirm subscription upgrade after successful checkout
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return auth.response;
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

    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Checkout session not found" }, { status: 404 });
    }

  const userId = auth.token.uid;

    const sessionUserId = session.metadata?.userId || session.client_reference_id;
    if (!sessionUserId || sessionUserId !== userId) {
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
      return NextResponse.json(
        { error: "No subscription information available for this session" },
        { status: 400 }
      );
    }

    const planFromMetadata = session.metadata?.plan ?? "premium";
    if (planFromMetadata !== "premium") {
      return NextResponse.json({ error: "Invalid plan in checkout session metadata" }, { status: 400 });
    }

    const plan = "premium";

    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

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
