import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Webhook } from "svix";

interface ClerkWebhookEvent {
  type: string;
  data: any;
}

export const clerkWebhook = httpAction(async (ctx, request) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
    return new Response("Server configuration error", { status: 500 });
  }

  try {
    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("Missing svix headers");
      return new Response("Missing headers", { status: 400 });
    }

    const body = await request.text();
    const wh = new Webhook(WEBHOOK_SECRET);

    let event: ClerkWebhookEvent;
    try {
      event = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    if (event.type === "user.created") {
      const user = event.data;
      const clerkId: string = user.id;
      const email: string = user.email_addresses?.[0]?.email_address ?? "";
      const name: string = [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ");
      
      // Check if user should be admin based on email
      const isAdmin = email === process.env.ADMIN_EMAIL;

      await ctx.runMutation(api.users.createUser, {
        clerkId,
        email,
        name,
        isAdmin, // Add isAdmin field
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.error("Clerk webhook error", e);
    return new Response("Internal server error", { status: 500 });
  }
});
