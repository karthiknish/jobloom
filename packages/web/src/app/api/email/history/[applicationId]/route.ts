import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { withApi, OPTIONS } from "@/lib/api/withApi";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

/**
 * GET /api/email/history/:applicationId
 * Fetch email history for a specific application
 */
export const GET = withApi({
  auth: "required",
}, async ({ params, user }) => {
  const { applicationId } = params;
  const db = getAdminDb();

  // Fetch email sends for this application
  const emailSendsSnapshot = await db.collection("emailSends")
    .where("applicationId", "==", applicationId)
    .orderBy("sentAt", "desc")
    .get();

  const history = emailSendsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Filter by userId to ensure security (only owner can see history)
  const filteredHistory = history.filter(item => (item as any).userId === user!.uid);

  return { history: filteredHistory };
});
