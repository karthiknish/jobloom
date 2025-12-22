import { withApi, z } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { getStripeClient, getStripeSuccessUrl } from "@/lib/stripe";
import { NotFoundError } from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";

export const runtime = "nodejs";

export const POST = withApi({
  auth: 'required',
  rateLimit: 'subscription',
}, async ({ user, request }) => {
  const db = getAdminDb();
  const stripe = getStripeClient();
  const userId = user!.uid;

  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.data() as Record<string, any> | undefined;

  const stripeCustomerId = userData?.stripeCustomerId;

  if (!stripeCustomerId) {
    throw new NotFoundError(
      "No Stripe customer associated with this user",
      "stripe-customer",
      ERROR_CODES.USER_NOT_FOUND
    );
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

  return {
    success: true,
    url: portalSession.url,
  };
});

export { OPTIONS } from "@/lib/api/withApi";
