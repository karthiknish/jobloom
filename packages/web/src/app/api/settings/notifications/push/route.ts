import { withApi, z } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { AuthorizationError } from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";

const PushSubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
});

export const POST = withApi({
  auth: "required",
  bodySchema: PushSubscriptionSchema,
}, async ({ user, body }) => {
  const db = getAdminDb();
  const userId = user!.uid;
  const { subscription } = body;

  // Save or update the subscription
  // We use the endpoint URL as the ID (hashed) to avoid duplicates, 
  // or just a generated ID since a user can have multiple devices.
  const subscriptionId = Buffer.from(subscription.endpoint).toString('base64').replace(/[/+=]/g, '_');
  
  await db.collection("users").doc(userId).collection("pushSubscriptions").doc(subscriptionId).set({
    ...subscription,
    updatedAt: Date.now(),
  });

  return { success: true };
});

export const DELETE = withApi({
  auth: "required",
  bodySchema: z.object({ endpoint: z.string().url() }),
}, async ({ user, body }) => {
  const db = getAdminDb();
  const userId = user!.uid;
  const subscriptionId = Buffer.from(body.endpoint).toString('base64').replace(/[/+=]/g, '_');

  await db.collection("users").doc(userId).collection("pushSubscriptions").doc(subscriptionId).delete();

  return { success: true };
});

export { OPTIONS } from "@/lib/api/withApi";
