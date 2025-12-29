import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, Timestamp } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";

/**
 * GET /api/admin/feedback/process
 * Automated job to process feedback and generate learning points.
 * Usually called by Vercel Cron.
 */
export const GET = withApi({
  auth: "none", // Manual check for admin or cron secret
  rateLimit: "admin",
}, async ({ request, user }) => {
  // 0. Authorization check: Admin user or Cron Secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isAdmin = user?.isAdmin;

  if (!isCron && !isAdmin) {
    return {
      success: false,
      message: "Unauthorized: Admin access or valid cron secret required",
    };
  }

  const db = getAdminDb();
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 1. Fetch negative feedback from last 24h
  const feedbackSnapshot = await db.collection("ai_feedback")
    .where("sentiment", "==", "negative")
    .where("createdAt", ">=", last24h.getTime())
    .get();

  if (feedbackSnapshot.empty) {
    return {
      message: "No negative feedback to process in the last 24h",
      timestamp: now.toISOString(),
    };
  }

  const negativeFeedback = feedbackSnapshot.docs.map(doc => doc.data());

  // 2. Aggregate problematic contexts and metadata
  const recurringIssues: Record<string, { count: number; examples: string[] }> = {};

  negativeFeedback.forEach(f => {
    const key = f.context || f.contentType || "unknown";
    if (!recurringIssues[key]) {
      recurringIssues[key] = { count: 0, examples: [] };
    }
    recurringIssues[key].count++;
    if (f.comment && recurringIssues[key].examples.length < 5) {
      recurringIssues[key].examples.push(f.comment);
    }
  });

  // 3. Store "Learning Points"
  const learningPoint = {
    date: Timestamp.fromDate(now),
    totalNegativeProcessed: negativeFeedback.length,
    issues: recurringIssues,
    metadata: {
      processedAt: now.toISOString(),
    }
  };

  const docRef = await db.collection("ai_learning_points").add(learningPoint);

  return {
    message: `Processed ${negativeFeedback.length} negative feedback entries`,
    learningPointId: docRef.id,
    timestamp: now.toISOString(),
  };
});
