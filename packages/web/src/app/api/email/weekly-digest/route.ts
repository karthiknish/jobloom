import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";
import { renderReminderEmailHtml, renderReminderEmailText } from "@/emails/reminderEmail";
import { getAdminDb } from "@/firebase/admin";

/**
 * POST /api/email/weekly-digest
 * Send weekly digest emails to all users with email notifications enabled
 * This should be called by a cron job (e.g., Vercel Cron)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getAdminDb();
    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: 0,
    };
    
    // Get all users who have weekly digest enabled (or don't have it explicitly disabled)
    const usersSnapshot = await db.collection("users").get();
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    for (const userDoc of usersSnapshot.docs) {
      results.processed++;
      
      const userData = userDoc.data();
      const userId = userDoc.id;
      const userEmail = userData?.email;
      const userName = userData?.name || userData?.displayName;
      const emailPrefs = userData?.emailPreferences || {};

      // Skip if user disabled weekly digest
      if (emailPrefs.weeklyDigest === false) {
        results.skipped++;
        continue;
      }

      // Skip if no email
      if (!userEmail) {
        results.skipped++;
        continue;
      }

      try {
        // Get user's applications
        const applicationsSnapshot = await db.collection("applications")
          .where("userId", "==", userId)
          .get();

        if (applicationsSnapshot.empty) {
          results.skipped++;
          continue;
        }

        const applications = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Calculate stats
        const totalApplications = applications.length;
        const applicationsThisWeek = applications.filter((app: any) => {
          const createdAt = app.createdAt?.toDate?.() || new Date(app.createdAt);
          return createdAt >= oneWeekAgo;
        }).length;

        // Get upcoming interviews (status = interviewing with future interview dates)
        const upcomingInterviews = applications
          .filter((app: any) => {
            if (app.status !== "interviewing") return false;
            const dates = app.interviewDates || [];
            return dates.some((d: any) => new Date(d) > new Date());
          })
          .map((app: any) => ({
            jobTitle: app.job?.title || "Job",
            company: app.job?.company || "Company",
            date: app.interviewDates?.find((d: any) => new Date(d) > new Date()) || new Date(),
          }))
          .slice(0, 3);

        // Get pending follow-ups (applied > 1 week ago, no response)
        const pendingFollowUps = applications
          .filter((app: any) => {
            if (app.status !== "applied") return false;
            const appliedDate = app.appliedDate || app.createdAt;
            const applied = appliedDate?.toDate?.() || new Date(appliedDate);
            const daysSinceApplied = (Date.now() - applied.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceApplied >= 7 && daysSinceApplied <= 21;
          })
          .map((app: any) => ({
            jobTitle: app.job?.title || "Job",
            company: app.job?.company || "Company",
            appliedDate: app.appliedDate || app.createdAt,
          }))
          .slice(0, 5);

        // Skip if nothing to report
        if (applicationsThisWeek === 0 && upcomingInterviews.length === 0 && pendingFollowUps.length === 0) {
          results.skipped++;
          continue;
        }

        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://hireall.app'}/dashboard`;

        const emailProps = {
          userName,
          reminderType: "weekly_digest" as const,
          totalApplications,
          applicationsThisWeek,
          upcomingInterviews,
          pendingFollowUps,
          dashboardUrl,
        };

        const html = renderReminderEmailHtml(emailProps);
        const text = renderReminderEmailText(emailProps);

        const result = await sendEmail({
          to: userEmail,
          subject: `📊 Your Weekly Job Search Summary`,
          html,
          text,
        });

        if (result.success) {
          results.sent++;
          
          // Log the email send
          await db.collection("emailSends").add({
            type: "weekly_digest",
            userId,
            messageId: result.messageId,
            stats: {
              totalApplications,
              applicationsThisWeek,
              upcomingInterviews: upcomingInterviews.length,
              pendingFollowUps: pendingFollowUps.length,
            },
            sentAt: new Date().toISOString(),
          });
        } else {
          results.errors++;
          console.error(`Failed to send digest to ${userEmail}:`, result.error);
        }

      } catch (error) {
        results.errors++;
        console.error(`Error processing user ${userId}:`, error);
      }
    }

    console.log("Weekly digest results:", results);
    
    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error) {
    console.error("Weekly digest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support GET for manual triggering in development
export async function GET(req: NextRequest) {
  // Only allow in development or with proper auth
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Use POST in production" }, { status: 405 });
  }
  return POST(req);
}
