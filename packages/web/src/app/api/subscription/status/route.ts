import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb, Timestamp } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";
import { SUBSCRIPTION_LIMITS, Subscription, SubscriptionPlan } from "@/types/api";
import { ValidationError, DatabaseError } from "@/lib/subscriptions";
import { checkServerRateLimit } from "@/lib/rateLimiter";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

// Input validation
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

// Security headers
function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

// GET /api/subscription/status - Get current subscription status
export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifySessionFromRequest(request);

    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In development with mock tokens, return mock subscription status for testing
    const isMockToken = process.env.NODE_ENV === "development" &&
      request.headers.get("authorization")?.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc");

    if (isMockToken) {
      return NextResponse.json({
        plan: "free",
        status: "active",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        message: 'Subscription status retrieved successfully (mock)'
      });
    }

    const userId = decodedToken.uid;
    
    // Apply rate limiting
    const rateLimitResult = checkServerRateLimit(userId, 'subscription-status');
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

    // Get user record
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as Record<string, any> | undefined;

    let subscription: Subscription | null = null;
    let plan: SubscriptionPlan = "free";

    if (userData?.subscriptionId) {
      const subscriptionDoc = await db.collection("subscriptions").doc(userData.subscriptionId).get();

      if (subscriptionDoc.exists) {
        const data = subscriptionDoc.data() as Record<string, any> | undefined;

        if (data) {
          const toMillis = (value: Timestamp | number | null | undefined) => {
            if (value instanceof Timestamp) {
              return value.toMillis();
            }
            return typeof value === "number" ? value : null;
          };

          subscription = {
            _id: subscriptionDoc.id,
            userId: data.userId ?? userId,
            plan: (data.plan ?? "premium") as SubscriptionPlan,
            status: data.status ?? "inactive",
            currentPeriodStart: toMillis(data.currentPeriodStart ?? null),
            currentPeriodEnd: toMillis(data.currentPeriodEnd ?? null),
            cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
            createdAt: toMillis(data.createdAt ?? null),
            updatedAt: toMillis(data.updatedAt ?? null),
            stripeSubscriptionId: data.stripeSubscriptionId ?? undefined,
            stripeCustomerId: data.stripeCustomerId ?? undefined,
            billingCycle: data.billingCycle ?? null,
            price: typeof data.price === "number" ? data.price : null,
            currency: data.currency ?? null,
            customerPortalUrl: data.customerPortalUrl ?? null,
            trialStart: toMillis(data.trialStart ?? null),
            trialEnd: toMillis(data.trialEnd ?? null),
            cancelAt: toMillis(data.cancelAt ?? null),
            canceledAt: toMillis(data.canceledAt ?? null),
            endedAt: toMillis(data.endedAt ?? null),
            latestInvoiceId: data.latestInvoiceId ?? null,
            latestInvoiceStatus: data.latestInvoiceStatus ?? null,
            collectionMethod: data.collectionMethod ?? null,
          };

          if (subscription.plan in SUBSCRIPTION_LIMITS) {
            plan = subscription.plan;
          }
        }
      }
    }

    if (!subscription && typeof userData?.plan === "string" && userData.plan in SUBSCRIPTION_LIMITS) {
      plan = userData.plan as SubscriptionPlan;
    }

    const limits = SUBSCRIPTION_LIMITS[plan] ?? SUBSCRIPTION_LIMITS.free;

    // Get current usage for this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // CV analyses usage
    const cvAnalysesQuery = await db.collection("cvAnalyses")
      .where("userId", "==", userId)
      .where("createdAt", ">=", Timestamp.fromDate(startOfMonth))
      .get();

    // Application usage (simplified - just count total for now)
    const applicationsQuery = await db.collection("applications")
      .where("userId", "==", userId)
      .get();

    const currentUsage = {
      cvAnalyses: cvAnalysesQuery.size,
      applications: applicationsQuery.size,
    };

    const customerPortalUrl = subscription?.customerPortalUrl ?? userData?.stripeCustomerPortalUrl ?? null;
    const checkoutUrl = userData?.pendingCheckoutUrl ?? null;
    const cancelUrl = subscription ? "/api/subscription/cancel" : null;
    const resumeUrl = subscription?.cancelAtPeriodEnd ? "/api/subscription/resume" : null;

    const response = NextResponse.json({
      subscription,
      plan,
      limits,
      currentUsage,
      actions: {
        customerPortalUrl,
        checkoutUrl,
        cancelUrl,
        resumeUrl,
      },
    });
    
    return setSecurityHeaders(response);
    
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    
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
