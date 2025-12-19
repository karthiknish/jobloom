import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/resend";
import { renderStatusChangeEmailHtml, renderStatusChangeEmailText, STATUS_CHANGE_SUBJECT } from "@/emails/statusChangeEmail";
import { getAdminDb } from "@/firebase/admin";
import { withApi, OPTIONS } from "@/lib/api/withApi";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

type ApplicationStatus = "saved" | "applied" | "interviewing" | "offered" | "rejected" | "withdrawn";

const BodySchema = z.object({
  applicationId: z.string().min(1),
  previousStatus: z.string().min(1),
  newStatus: z.string().min(1),
  skipEmail: z.boolean().optional(),
});

/**
 * POST /api/email/status-change
 * Send notification email when application status changes
 * Called from dashboard when status is updated
 */
export const POST = withApi({
  auth: "required",
  bodySchema: BodySchema,
}, async ({ body, user, request }) => {
  const { applicationId, previousStatus, newStatus, skipEmail = false } = body;

  // Skip if email notifications are disabled
  if (skipEmail) {
    return { sent: false, reason: "Email skipped by request" };
  }

  const db = getAdminDb();

  // Idempotency: prevent duplicate sends on retries.
  const idempotencyKeyHeader = request.headers.get("idempotency-key") || request.headers.get("Idempotency-Key");
  const idempotencyKey = (typeof idempotencyKeyHeader === "string" && idempotencyKeyHeader.trim())
    ? idempotencyKeyHeader.trim()
    : `status-change:${applicationId}:${previousStatus}:${newStatus}`;

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
    tx.set(idemRef, { status: "sending", type: "status_change", applicationId, previousStatus, newStatus, updatedAt: new Date().toISOString() }, { merge: true });
    return { ok: true as const };
  });

  if (!shouldSend.ok) {
    return NextResponse.json(shouldSend.payload, { status: shouldSend.status });
  }
  
  // Fetch application details
  const appDoc = await db.collection("applications").doc(applicationId).get();
  if (!appDoc.exists) {
    await idemRef.set({ status: "failed", error: "application_not_found", updatedAt: new Date().toISOString() }, { merge: true });
    throw new Error("Application not found");
  }
  
  const application = appDoc.data();
  const userId = application?.userId;

  if (!userId || userId !== user!.uid) {
    await idemRef.set({ status: "failed", error: "forbidden", updatedAt: new Date().toISOString() }, { merge: true });
    throw new Error("Forbidden: You do not have access to this application");
  }

  // Fetch user to get email and preferences
  let userData: any;
  const userQuery = await db.collection("users").where("uid", "==", userId).limit(1).get();
  if (userQuery.empty) {
    // Try by document ID
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      await idemRef.set({ status: "failed", error: "user_not_found", updatedAt: new Date().toISOString() }, { merge: true });
      throw new Error("User not found");
    }
    userData = userDoc.data();
  } else {
    userData = userQuery.docs[0].data();
  }

  const userEmail = userData?.email;
  if (!userEmail || typeof userEmail !== "string") {
    await idemRef.set({ status: "skipped", reason: "missing_email", updatedAt: new Date().toISOString() }, { merge: true });
    return { sent: false, reason: "User has no email" };
  }

  const userName = userData?.name || userData?.displayName;
  const emailPrefs = userData?.emailPreferences || {};

  // Check if user has disabled status notifications
  if (emailPrefs.statusUpdates === false) {
    await idemRef.set({ status: "skipped", reason: "user_disabled", updatedAt: new Date().toISOString() }, { merge: true });
    return { sent: false, reason: "User disabled status notifications" };
  }

  // Build email content
  const jobTitle = application?.job?.title || "Job Application";
  const companyName = application?.job?.company || "Company";
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://hireall.app'}/dashboard`;
  const jobUrl = application?.job?.url;

  const html = renderStatusChangeEmailHtml({
    userName,
    jobTitle,
    companyName,
    previousStatus: previousStatus as ApplicationStatus,
    newStatus: newStatus as ApplicationStatus,
    dashboardUrl,
    jobUrl,
  });

  const text = renderStatusChangeEmailText({
    userName,
    jobTitle,
    companyName,
    previousStatus: previousStatus as ApplicationStatus,
    newStatus: newStatus as ApplicationStatus,
    dashboardUrl,
  });

  // Send the email
  const result = await sendEmail({
    to: userEmail,
    subject: `${STATUS_CHANGE_SUBJECT}: ${jobTitle} at ${companyName}`,
    html,
    text,
  });

  if (!result.success) {
    console.error("Failed to send status change email:", result.error);
    await idemRef.set({ status: "failed", error: result.error, updatedAt: new Date().toISOString() }, { merge: true });
    throw new Error(`Failed to send email: ${result.error}`);
  }

  await idemRef.set({ status: result.skipped ? "skipped" : "sent", messageId: result.messageId ?? null, updatedAt: new Date().toISOString() }, { merge: true });

  // Log the email send
  await db.collection("emailSends").add({
    type: "status_change",
    userId,
    applicationId,
    previousStatus,
    newStatus,
    messageId: result.messageId,
    sentAt: new Date().toISOString(),
  });

  return {
    sent: true,
    messageId: result.messageId,
  };
});
