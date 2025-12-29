import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { renderReminderEmailHtml, renderReminderEmailText, REMINDER_EMAIL_SUBJECT } from "@/emails/reminderEmail";
import { getAdminDb } from "@/firebase/admin";
import { withApi, OPTIONS } from "@/lib/api/withApi";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

/**
 * POST /api/email/follow-up-automation
 * Automatically send follow-up reminders for applications that are due
 */
export const POST = withApi({
  auth: "none",
}, async ({ request }) => {
  // Verify secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    throw new Error("Unauthorized: Invalid secret");
  }

  const db = getAdminDb();
  const results = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
  };
  
  const now = Date.now();
  
  // Get all applications that are in 'applied' status and have a followUpDate in the past or today
  const applicationsSnapshot = await db.collection("applications")
    .where("status", "==", "applied")
    .where("followUpDate", "<=", now)
    .get();
  
  for (const appDoc of applicationsSnapshot.docs) {
    results.processed++;
    
    const appData = appDoc.data();
    const applicationId = appDoc.id;
    const userId = appData.userId;

    try {
      // Check if we already sent a follow-up email for this application recently
      // (e.g., in the last 3 days to avoid spamming if the job runs daily and followUpDate is still in the past)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const existingSends = await db.collection("emailSends")
        .where("applicationId", "==", applicationId)
        .where("type", "==", "reminder")
        .where("reminderType", "==", "follow_up")
        .where("sentAt", ">=", threeDaysAgo.toISOString())
        .limit(1)
        .get();

      if (!existingSends.empty) {
        results.skipped++;
        continue;
      }

      // Fetch user
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        results.skipped++;
        continue;
      }
      
      const userData = userDoc.data();
      const userEmail = userData?.email;
      if (!userEmail) {
        results.skipped++;
        continue;
      }

      const userName = userData?.name || userData?.displayName;
      const emailPrefs = userData?.emailPreferences || {};
      const prefs = userData?.preferences || {};

      // Master toggle: user-level email notifications
      if (prefs.emailNotifications === false) {
        results.skipped++;
        continue;
      }

      // Check if user has disabled reminder notifications
      if (emailPrefs.reminders === false) {
        results.skipped++;
        continue;
      }

      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://hireall.app'}/dashboard`;

      const emailProps = {
        userName,
        reminderType: "follow_up" as const,
        jobTitle: appData?.job?.title || "Job Application",
        companyName: appData?.job?.company || "Company",
        reminderDate: appData.followUpDate,
        notes: appData.notes,
        dashboardUrl,
      };

      const html = renderReminderEmailHtml(emailProps);
      const text = renderReminderEmailText(emailProps);

      const subject = `${REMINDER_EMAIL_SUBJECT}: ${emailProps.jobTitle} at ${emailProps.companyName}`;

      const result = await sendEmail({
        to: userEmail,
        subject,
        html,
        text,
        tags: [
          { name: "category", value: "automation" },
          { name: "type", value: "follow_up" }
        ]
      });

      if (result.success) {
        results.sent++;
        
        // Log the email send
        await db.collection("emailSends").add({
          type: "reminder",
          reminderType: "follow_up",
          userId,
          applicationId,
          messageId: result.messageId,
          sentAt: new Date().toISOString(),
          automated: true,
        });
      } else {
        results.errors++;
        console.error(`Failed to send follow-up to ${userEmail}:`, result.error);
      }

    } catch (error) {
      results.errors++;
      console.error(`Error processing application ${applicationId}:`, error);
    }
  }

  return { results };
});
