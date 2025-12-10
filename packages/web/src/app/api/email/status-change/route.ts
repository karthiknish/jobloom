import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";
import { renderStatusChangeEmailHtml, renderStatusChangeEmailText, STATUS_CHANGE_SUBJECT } from "@/emails/statusChangeEmail";
import { getAdminDb, verifyIdToken } from "@/firebase/admin";

type ApplicationStatus = "saved" | "applied" | "interviewing" | "offered" | "rejected" | "withdrawn";

/**
 * POST /api/email/status-change
 * Send notification email when application status changes
 * Called from dashboard when status is updated
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check (only authenticated users or internal calls)
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
      applicationId, 
      previousStatus, 
      newStatus, 
      skipEmail = false 
    } = body;

    if (!applicationId || !previousStatus || !newStatus) {
      return NextResponse.json(
        { error: "Missing required fields: applicationId, previousStatus, newStatus" },
        { status: 400 }
      );
    }

    // Skip if email notifications are disabled
    if (skipEmail) {
      return NextResponse.json({ sent: false, reason: "Email skipped by request" });
    }

    const db = getAdminDb();
    
    // Fetch application details
    const appDoc = await db.collection("applications").doc(applicationId).get();
    if (!appDoc.exists) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    
    const application = appDoc.data();
    const userId = application?.userId;

    // Fetch user to get email and preferences
    let userData: any;
    const userQuery = await db.collection("users").where("uid", "==", userId).limit(1).get();
    if (userQuery.empty) {
      // Try by document ID
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      userData = userDoc.data();
    } else {
      userData = userQuery.docs[0].data();
    }

    const userEmail = userData?.email;
    const userName = userData?.name || userData?.displayName;
    const emailPrefs = userData?.emailPreferences || {};

    // Check if user has disabled status notifications
    if (emailPrefs.statusUpdates === false) {
      return NextResponse.json({ sent: false, reason: "User disabled status notifications" });
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
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 }
      );
    }

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

    return NextResponse.json({
      sent: true,
      messageId: result.messageId,
    });

  } catch (error) {
    console.error("Status change email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
