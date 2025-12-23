import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

/**
 * POST /api/webhooks/brevo
 * Webhook handler for Brevo email events (opened, clicked, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Note: Brevo webhook payload structure is different from Resend
    // This is a placeholder for Brevo webhook integration
    console.log("Brevo webhook received:", body);
    
    const { event, messageId, timestamp } = body;

    if (!event || !messageId) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const db = getAdminDb();

    // Log the event
    await db.collection("emailEvents").add({
      emailId: messageId,
      type: event, // e.g., 'opened', 'clicked', 'delivered'
      data: body,
      createdAt: timestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    });

    // Update the original email send record if it exists
    const emailSendsSnapshot = await db.collection("emailSends")
      .where("messageId", "==", messageId)
      .limit(1)
      .get();

    if (!emailSendsSnapshot.empty) {
      const emailSendDoc = emailSendsSnapshot.docs[0];
      const currentData = emailSendDoc.data();
      
      const updates: any = {
        lastEventAt: new Date().toISOString(),
      };

      if (event === "opened") {
        updates.opened = true;
        updates.openCount = (currentData.openCount || 0) + 1;
      } else if (event === "request" || event === "click") {
        updates.clicked = true;
        updates.clickCount = (currentData.clickCount || 0) + 1;
      } else if (event === "delivered") {
        updates.delivered = true;
        updates.deliveredAt = timestamp || new Date().toISOString();
      } else if (event === "deferred" || event === "soft_bounce" || event === "hard_bounce") {
        updates.bounced = true;
      } else if (event === "spam" || event === "complaint") {
        updates.complained = true;
      }

      await emailSendDoc.ref.update(updates);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Brevo webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Support OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
