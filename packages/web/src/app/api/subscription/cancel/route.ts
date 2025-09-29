import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb } from "@/firebase/admin";
import { getStripeClient } from "@/lib/stripe";
import { upsertSubscriptionFromStripe } from "@/lib/subscriptions";
import { FieldValue } from "firebase-admin/firestore";

const stripe = getStripeClient();
const db = getAdminDb();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decodedToken.uid;

    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as Record<string, any> | undefined;

    const subscriptionId = userData?.subscriptionId;

    if (!subscriptionId) {
      return NextResponse.json({
        error: "No active subscription found for this user",
      }, { status: 404 });
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["latest_invoice.payment_intent"],
    });

    if (stripeSubscription.cancel_at_period_end) {
      return NextResponse.json({
        success: true,
        subscription: {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          currentPeriodEnd: stripeSubscription.current_period_end
            ? stripeSubscription.current_period_end * 1000
            : null,
        },
        message: "Subscription is already scheduled to cancel at period end",
      });
    }

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    await upsertSubscriptionFromStripe({
      subscription: updatedSubscription,
      userId,
      plan: (updatedSubscription.metadata?.plan ?? userData?.plan ?? "premium") as string,
      billingCycle: updatedSubscription.metadata?.billingCycle ?? undefined,
    });

    await db.collection("users").doc(userId).set({
      subscriptionId: updatedSubscription.id,
      stripeCustomerId: updatedSubscription.customer as string,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        currentPeriodEnd: updatedSubscription.current_period_end
          ? updatedSubscription.current_period_end * 1000
          : null,
      },
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

