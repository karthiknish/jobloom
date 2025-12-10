import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";
import { renderReminderEmailHtml, renderReminderEmailText, REMINDER_EMAIL_SUBJECT } from "@/emails/reminderEmail";
import { getAdminDb, verifyIdToken } from "@/firebase/admin";

type ReminderType = "follow_up" | "interview" | "deadline" | "weekly_digest";

/**
 * POST /api/email/reminder
 * Send reminder emails (follow-up, interview, deadline)
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      userId,
      reminderType,
      applicationId,
      reminderDate,
      notes,
    } = body;

    if (!userId || !reminderType) {
      return NextResponse.json(
        { error: "Missing required fields: userId, reminderType" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Fetch user
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userData = userDoc.data();
    const userEmail = userData?.email;
    const userName = userData?.name || userData?.displayName;
    const emailPrefs = userData?.emailPreferences || {};

    // Check if user has disabled reminder notifications
    if (emailPrefs.reminders === false) {
      return NextResponse.json({ sent: false, reason: "User disabled reminder notifications" });
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

    const result = await sendEmail({
      to: userEmail,
      subject,
      html,
      text,
    });

    if (!result.success) {
      console.error("Failed to send reminder email:", result.error);
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 }
      );
    }

    // Log the email send
    await db.collection("emailSends").add({
      type: "reminder",
      reminderType,
      userId,
      applicationId: applicationId || null,
      messageId: result.messageId,
      sentAt: new Date().toISOString(),
    });

    return NextResponse.json({
      sent: true,
      messageId: result.messageId,
    });

  } catch (error) {
    console.error("Reminder email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
