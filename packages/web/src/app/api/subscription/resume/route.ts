import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb } from "@/firebase/admin";
import { getStripeClient } from "@/lib/stripe";
import { upsertSubscriptionFromStripe, ValidationError, DatabaseError } from "@/lib/subscriptions";
import { FieldValue } from "@/firebase/admin";
import { checkServerRateLimit } from "@/lib/rateLimiter";
import type Stripe from "stripe";

const stripe = getStripeClient();
const db = getAdminDb();

function validateAuthorizationHeader(authHeader: string | null): { isValid: boolean; token?: string; error?: string } {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { isValid: false, error: "Missing or invalid authorization header" };
  }
  
  const token = authHeader.substring(7);
  if (!token || token.trim().length === 0) {
    return { isValid: false, error: "Empty token" };
  }
  
  return { isValid: true, token };
}

function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

type SubscriptionWithLegacyPeriods = Stripe.Subscription & {
  current_period_end?: number | null;
};

const resolveCurrentPeriodEnd = (
  subscription: Stripe.Subscription
): number | null => {
  const legacy = subscription as SubscriptionWithLegacyPeriods;
  return typeof legacy.current_period_end === "number"
    ? legacy.current_period_end * 1000
    : null;
};

export async function POST(request: NextRequest) {
  try {
    // Validate authorization header
    const authHeader = request.headers.get("authorization");
    const authValidation = validateAuthorizationHeader(authHeader);
    
    if (!authValidation.isValid) {
      const response = NextResponse.json({ error: authValidation.error }, { status: 401 });
      return setSecurityHeaders(response);
    }

    const token = authValidation.token!;
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      const response = NextResponse.json({ error: "Invalid token" }, { status: 401 });
      return setSecurityHeaders(response);
    }

    const userId = decodedToken.uid;
    
    // Apply stricter rate limiting for sensitive operations
    const rateLimitResult = checkServerRateLimit(userId, 'subscription-resume');
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json({ 
        error: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetIn || 0) / 1000)} seconds.`,
        resetTime: rateLimitResult.resetIn
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': (rateLimitResult.maxRequests || 0).toString(),
          'X-RateLimit-Remaining': (rateLimitResult.remaining || 0).toString(),
          'X-RateLimit-Reset': (rateLimitResult.resetIn || 0).toString()
        }
      });
      return setSecurityHeaders(response);
    }

    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as Record<string, any> | undefined;

    const subscriptionId = userData?.subscriptionId;

    if (!subscriptionId) {
      const response = NextResponse.json({
        error: "No active subscription found for this user",
      }, { status: 404 });
      return setSecurityHeaders(response);
    }

    const stripeSubscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["latest_invoice.payment_intent"],
    });
    const stripeSubscription = stripeSubscriptionResponse as Stripe.Subscription;

    if (!stripeSubscription.cancel_at_period_end) {
      const response = NextResponse.json({
        success: true,
        subscription: {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          currentPeriodEnd: resolveCurrentPeriodEnd(stripeSubscription),
        },
        message: "Subscription is not set to cancel",
      });
      return setSecurityHeaders(response);
    }

    const updatedSubscriptionResponse = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    const updatedSubscription = updatedSubscriptionResponse as Stripe.Subscription;

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

    const response = NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        currentPeriodEnd: resolveCurrentPeriodEnd(updatedSubscription),
      },
    });
    
    return setSecurityHeaders(response);
    
  } catch (error) {
    console.error("Error resuming subscription:", error);
    
    let statusCode = 500;
    let errorMessage = "Internal server error";
    
    if (error instanceof ValidationError) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error instanceof DatabaseError) {
      statusCode = 500;
      errorMessage = "Database operation failed";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    const response = NextResponse.json({ error: errorMessage }, { status: statusCode });
    return setSecurityHeaders(response);
  }
}

