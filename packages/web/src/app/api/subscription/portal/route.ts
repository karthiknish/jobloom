import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { getStripeClient, getStripeSuccessUrl } from "@/lib/stripe";

const stripe = getStripeClient();
const db = getAdminDb();

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return auth.response;
    }

    // In development with mock tokens, return mock portal URL for testing
    const isMockToken = process.env.NODE_ENV === "development" && 
      request.headers.get("authorization")?.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    if (isMockToken) {
      return NextResponse.json({ 
        url: 'https://billing.stripe.com/test-portal-session',
        message: 'Billing portal URL generated successfully (mock)'
      });
    }

  const userId = auth.token.uid;

    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as Record<string, any> | undefined;

    const stripeCustomerId = userData?.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json({
        error: "No Stripe customer associated with this user",
      }, { status: 404 });
    }

    const origin = request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      "http://localhost:3000";

  const returnUrl = getStripeSuccessUrl(origin).replace("?session_id={CHECKOUT_SESSION_ID}", "");

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${returnUrl}`,
    });

    await db.collection("users").doc(userId).set({
      stripeCustomerPortalUrl: portalSession.url,
    }, { merge: true });

    return NextResponse.json({
      success: true,
      url: portalSession.url,
    });
  } catch (error) {
    console.error("Error creating Stripe customer portal session:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

