import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe secret key (STRIPE_SECRET_KEY) is not configured");
  }

  stripeClient = new Stripe(secretKey);

  return stripeClient;
}

export type StripePlan = "premium";

const PRICE_ID_CONFIG: Record<StripePlan, string> = {
  premium: process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY || '',
};

export function getPriceIdForPlan(plan: StripePlan): string {
  const priceId = PRICE_ID_CONFIG[plan];
  if (!priceId) {
    throw new Error(`Stripe price ID not configured for plan "${plan}"`);
  }
  return priceId;
}

export function getStripeSuccessUrl(origin: string): string {
  const successUrl = process.env.STRIPE_SUCCESS_URL;
  if (successUrl) return `${successUrl}?session_id={CHECKOUT_SESSION_ID}`;
  return `${origin.replace(/\/$/, "")}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`;
}

export function getStripeCancelUrl(origin: string): string {
  const cancelUrl = process.env.STRIPE_CANCEL_URL;
  if (cancelUrl) return cancelUrl;
  return `${origin.replace(/\/$/, "")}/upgrade`;
}
