import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { getAdminDb, FieldValue } from "@/firebase/admin";
import { upsertSubscriptionFromStripe, ValidationError, DatabaseError } from "@/lib/subscriptions";
import { 
  createValidationError,
  createInternalError,
  handleExternalServiceError,
  handleDatabaseError,
  createSuccessResponse,
  withErrorHandler 
} from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";

export const runtime = "nodejs";

const stripe = getStripeClient();
const db = getAdminDb();

// Webhook event logging
async function logWebhookEvent(event: Stripe.Event, status: "success" | "error", error?: string) {
  try {
    await db.collection("webhookLogs").add({
      eventId: event.id,
      type: event.type,
      status,
      error: error || null,
      data: JSON.stringify(event.data.object),
      receivedAt: FieldValue.serverTimestamp(),
      processedAt: FieldValue.serverTimestamp(),
    });
  } catch (logError) {
    console.error("Failed to log webhook event:", logError);
  }
}

// Enhanced error recovery with retry logic
async function withWebhookRetry<T>(
  operation: () => Promise<T>,
  eventType: string,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        console.error(`Webhook processing failed after ${maxRetries} attempts for event ${eventType}:`, lastError);
        throw lastError;
      }
      
      const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
      console.warn(`Webhook processing attempt ${attempt} failed for event ${eventType}, retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  return await withWebhookRetry(async () => {
    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
    const userId = session.metadata?.userId || session.client_reference_id;
    const plan = session.metadata?.plan ?? "premium";

    if (!subscriptionId || !userId) {
      throw new Error(`Checkout session missing necessary metadata: subscriptionId=${subscriptionId}, userId=${userId}`);
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await upsertSubscriptionFromStripe({
      subscription,
      userId,
      plan,
    });

    await db.collection("subscriptionCheckouts").doc(session.id).set(
      {
        status: "completed",
        subscriptionId,
        completedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }, "checkout.session.completed");
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  return await withWebhookRetry(async () => {
    const userId = subscription.metadata?.userId;
    const plan = subscription.metadata?.plan ?? "premium";

    if (!userId) {
      throw new Error(`Stripe subscription missing user metadata: subscriptionId=${subscription.id}`);
    }

    await upsertSubscriptionFromStripe({
      subscription,
      userId,
      plan,
    });
  }, "customer.subscription.updated");
}

// New webhook handlers for additional events
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  return await withWebhookRetry(async () => {
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      throw new Error(`Stripe subscription missing user metadata: subscriptionId=${subscription.id}`);
    }

    // Mark subscription as cancelled in database
    await db.collection("subscriptions").doc(subscription.id).update({
      status: "cancelled",
      cancelAtPeriodEnd: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Update user record to reflect cancellation
    await db.collection("users").doc(userId).update({
      plan: "free",
      subscriptionCancelledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }, "customer.subscription.deleted");
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  return await withWebhookRetry(async () => {
    const invoiceData = invoice as any;
    if (invoiceData.subscription) {
      const subscriptionId = typeof invoiceData.subscription === "string" 
        ? invoiceData.subscription 
        : invoiceData.subscription.id;
      
      // Update subscription payment status
      await db.collection("subscriptions").doc(subscriptionId).update({
        lastPaymentAt: FieldValue.serverTimestamp(),
        lastPaymentAmount: invoice.amount_paid / 100,
        lastPaymentCurrency: invoice.currency,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }, "invoice.payment_succeeded");
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  return await withWebhookRetry(async () => {
    const invoiceData = invoice as any;
    if (invoiceData.subscription) {
      const subscriptionId = typeof invoiceData.subscription === "string" 
        ? invoiceData.subscription 
        : invoiceData.subscription.id;
      
      // Mark subscription as having payment issues
      await db.collection("subscriptions").doc(subscriptionId).update({
        paymentFailedAt: FieldValue.serverTimestamp(),
        paymentFailedAmount: invoice.amount_due / 100,
        paymentFailedCurrency: invoice.currency,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Get subscription to update user record
      const subscriptionDoc = await db.collection("subscriptions").doc(subscriptionId).get();
      if (subscriptionDoc.exists) {
        const subscriptionData = subscriptionDoc.data();
        if (subscriptionData?.userId) {
          await db.collection("users").doc(subscriptionData.userId).update({
            paymentFailedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }
    }
  }, "invoice.payment_failed");
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  return await withWebhookRetry(async () => {
    // Update customer information in database
    const userQuery = await db.collection("users")
      .where("stripeCustomerId", "==", customer.id)
      .limit(1)
      .get();

    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      await userDoc.ref.update({
        customerEmail: customer.email,
        customerName: customer.name,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }, "customer.updated");
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    throw createValidationError("Missing Stripe signature", "signature");
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw createInternalError("Stripe webhook secret is not configured");
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown signature verification error";
    console.error("Failed to verify Stripe webhook signature:", errorMessage);
    throw createValidationError("Invalid webhook signature", "signature", {
      originalError: errorMessage
    });
  }

  try {
    // Log the webhook event receipt
    await logWebhookEvent(event, "success");

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      case "customer.updated": {
        const customer = event.data.object as Stripe.Customer;
        await handleCustomerUpdated(customer);
        break;
      }
      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription;
        // Handle trial ending notification
        console.log(`Trial ending for subscription ${subscription.id}`);
        break;
      }
      default: {
        // Log unhandled events for monitoring
        console.log(`Unhandled webhook event type: ${event.type}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown webhook handling error";
    console.error("Error handling Stripe webhook: ", errorMessage, {
      eventType: event.type,
      eventId: event.id,
    });

    // Log the error
    await logWebhookEvent(event, "error", errorMessage);

    // Return appropriate error response
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: "Validation error", details: errorMessage }, { status: 400 });
    }
    
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: "Database error", details: errorMessage }, { status: 500 });
    }

    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
});
