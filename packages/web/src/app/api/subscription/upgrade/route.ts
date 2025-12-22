import { getStripeClient } from "@/lib/stripe";
import { upsertSubscriptionFromStripe } from "@/lib/subscriptions";
import { withApi, z } from "@/lib/api/withApi";
import { AuthorizationError, ValidationError, NotFoundError } from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";

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
    throw new NotFoundError(
      "Checkout session not found",
      "checkout-session",
      ERROR_CODES.CONTENT_NOT_FOUND
    );
  }

  const sessionUserId = session.metadata?.userId || session.client_reference_id;
  if (!sessionUserId || sessionUserId !== userId) {
    throw new AuthorizationError(
      "Session does not belong to this user",
      ERROR_CODES.FORBIDDEN
    );
  }

  // Ensure checkout is actually completed and paid before we persist entitlement.
  // For subscriptions, Stripe typically sets session.status='complete' and payment_status='paid'.
  if (session.status !== "complete") {
    throw new ValidationError(
      "Checkout session is not complete",
      "session.status"
    );
  }

  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    throw new ValidationError(
      "Payment not confirmed for this checkout session",
      "session.payment_status"
    );
  }

  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription?.id;

  if (!subscriptionId) {
    throw new ValidationError(
      "No subscription information available for this session",
      "session.subscription"
    );
  }

  const planFromMetadata = session.metadata?.plan ?? "premium";
  if (planFromMetadata !== "premium") {
    throw new ValidationError(
      "Invalid plan in checkout session metadata",
      "session.metadata.plan"
    );
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
