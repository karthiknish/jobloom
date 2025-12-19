import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/resend";
import { renderReminderEmailHtml, renderReminderEmailText, REMINDER_EMAIL_SUBJECT } from "@/emails/reminderEmail";
import { getAdminDb } from "@/firebase/admin";
import { withApi, OPTIONS } from "@/lib/api/withApi";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

type ReminderType = "follow_up" | "interview" | "deadline" | "weekly_digest";

const BodySchema = z.object({
  userId: z.string().min(1),
  reminderType: z.enum(["follow_up", "interview", "deadline", "weekly_digest"]),
  applicationId: z.string().optional(),
  reminderDate: z.any().optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/email/reminder
 * Send reminder emails (follow-up, interview, deadline)
 */
export const POST = withApi({
  auth: "required",
  bodySchema: BodySchema,
}, async ({ body, user, request }) => {
  const { userId, reminderType, applicationId, reminderDate, notes } = body;

  // Only allow a user to send reminders to themselves.
  if (user!.uid !== userId) {
    throw new Error("Forbidden: You can only send reminders to yourself");
  }

  const db = getAdminDb();

  // Idempotency: prevent duplicate sends on retries.
  const idempotencyKeyHeader = request.headers.get("idempotency-key") || request.headers.get("Idempotency-Key");
  const idempotencyKey = (typeof idempotencyKeyHeader === "string" && idempotencyKeyHeader.trim())
    ? idempotencyKeyHeader.trim()
    : `reminder:${userId}:${reminderType}:${applicationId ?? "none"}`;

  const idemRef = db.collection("emailIdempotency").doc(idempotencyKey);
  const shouldSend = await db.runTransaction(async (tx) => {
    const snap = await tx.get(idemRef);
    if (snap.exists) {
      const data = snap.data() as any;
      if (data?.status === "sent") {
        return { ok: false as const, status: 200 as const, payload: { sent: false, duplicate: true, messageId: data?.messageId } };
      }
      if (data?.status === "sending") {
        return { ok: false as const, status: 409 as const, payload: { sent: false, reason: "Email send already in progress" } };
      }
      // status failed/unknown: allow retry
    }
    tx.set(idemRef, { status: "sending", type: "reminder", userId, reminderType, applicationId: applicationId ?? null, updatedAt: new Date().toISOString() }, { merge: true });
    return { ok: true as const };
  });

  if (!shouldSend.ok) {
    return NextResponse.json(shouldSend.payload, { status: shouldSend.status });
  }

  // Fetch user
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    await idemRef.set({ status: "failed", error: "user_not_found", updatedAt: new Date().toISOString() }, { merge: true });
    throw new Error("User not found");
  }
  
  const userData = userDoc.data();
  const userEmail = userData?.email;
  if (!userEmail || typeof userEmail !== "string") {
    await idemRef.set({ status: "skipped", reason: "missing_email", updatedAt: new Date().toISOString() }, { merge: true });
    return { sent: false, reason: "User has no email" };
  }

  const userName = userData?.name || userData?.displayName;
  const emailPrefs = userData?.emailPreferences || {};

  // Check if user has disabled reminder notifications
  if (emailPrefs.reminders === false) {
    await idemRef.set({ status: "skipped", reason: "user_disabled", updatedAt: new Date().toISOString() }, { merge: true });
    return { sent: false, reason: "User disabled reminder notifications" };
  }

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://hireall.app'}/dashboard`;

  let emailProps: any = {
    userName,
    reminderType: reminderType as ReminderType,
    dashboardUrl,
  };

  // If this is for a specific application
  if (applicationId) {
    const appDoc = await db.collection("applications").doc(applicationId).get();
    if (appDoc.exists) {
      const appData = appDoc.data();
      emailProps.jobTitle = appData?.job?.title || "Job Application";
      emailProps.companyName = appData?.job?.company || "Company";
      emailProps.reminderDate = reminderDate;
      emailProps.notes = notes || appData?.notes;
    }
  }

  const html = renderReminderEmailHtml(emailProps);
  const text = renderReminderEmailText(emailProps);

  // Customize subject based on type
  let subject = REMINDER_EMAIL_SUBJECT;
  if (emailProps.jobTitle && emailProps.companyName) {
    subject = `${REMINDER_EMAIL_SUBJECT}: ${emailProps.jobTitle} at ${emailProps.companyName}`;
  }

  // Send the email
  const result = await sendEmail({
    to: userEmail,
    subject,
    html,
    text,
  });

  if (!result.success) {
    console.error("Failed to send reminder email:", result.error);
    await idemRef.set({ status: "failed", error: result.error, updatedAt: new Date().toISOString() }, { merge: true });
    throw new Error(`Failed to send email: ${result.error}`);
  }

  await idemRef.set({ status: result.skipped ? "skipped" : "sent", messageId: result.messageId ?? null, updatedAt: new Date().toISOString() }, { merge: true });

  // Log the email send
  await db.collection("emailSends").add({
    type: "reminder",
    reminderType,
    userId,
    applicationId: applicationId || null,
    messageId: result.messageId,
    sentAt: new Date().toISOString(),
  });

  return {
    sent: true,
    messageId: result.messageId,
  };
});
