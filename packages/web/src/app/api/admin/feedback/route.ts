import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";

/**
 * GET /api/admin/feedback
 * Fetch detailed AI feedback for analysis
 */
export const GET = withApi({
  auth: "admin",
  rateLimit: "admin",
}, async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const sentiment = searchParams.get("sentiment");
  const contentType = searchParams.get("contentType");
  const limit = parseInt(searchParams.get("limit") || "100");

  const db = getAdminDb();
  let query: any = db.collection("ai_feedback");

  if (sentiment) {
    query = query.where("sentiment", "==", sentiment);
  }
  if (contentType) {
    query = query.where("contentType", "==", contentType);
  }

  const snapshot = await query.orderBy("createdAt", "desc").limit(limit).get();
  const feedback = snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Simple aggregation for analysis
  const stats = {
    total: feedback.length,
    positive: feedback.filter((f: any) => f.sentiment === 'positive').length,
    negative: feedback.filter((f: any) => f.sentiment === 'negative').length,
    withComments: feedback.filter((f: any) => !!f.comment).length,
  };

  return {
    feedback,
    stats,
    timestamp: new Date().toISOString(),
  };
});
