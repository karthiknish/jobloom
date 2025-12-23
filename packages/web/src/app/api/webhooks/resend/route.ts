import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

/**
 * POST /api/webhooks/resend
 * Webhook handler for Resend email events (opened, clicked, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, created_at } = body;

    if (!type || !data || !data.email_id) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const db = getAdminDb();
    const emailId = data.email_id;

    // Log the event
    await db.collection("emailEvents").add({
      emailId,
      type, // e.g., 'email.opened', 'email.clicked'
      data,
      createdAt: created_at || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    });

    // Update the original email send record if it exists
    const emailSendsSnapshot = await db.collection("emailSends")
      .where("messageId", "==", emailId)
      .limit(1)
      .get();

    if (!emailSendsSnapshot.empty) {
      const emailSendDoc = emailSendsSnapshot.docs[0];
      const currentData = emailSendDoc.data();
      
      const updates: any = {
        lastEventAt: new Date().toISOString(),
      };

      if (type === "email.opened") {
        updates.opened = true;
        updates.openCount = (currentData.openCount || 0) + 1;
      } else if (type === "email.clicked") {
        updates.clicked = true;
        updates.clickCount = (currentData.clickCount || 0) + 1;
      } else if (type === "email.delivered") {
        updates.delivered = true;
        updates.deliveredAt = created_at || new Date().toISOString();
      } else if (type === "email.bounced") {
        updates.bounced = true;
      } else if (type === "email.complained") {
        updates.complained = true;
      }

      await emailSendDoc.ref.update(updates);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Resend webhook error:", error);
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
