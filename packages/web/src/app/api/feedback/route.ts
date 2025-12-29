import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { AuthorizationError } from "@/lib/api/errorResponse";

/**
 * GET /api/feedback
 * Fetch the current user's AI feedback history
 */
export const GET = withApi({
  auth: "required",
  rateLimit: "default",
}, async ({ user }) => {
  if (!user) {
    throw new AuthorizationError("Unauthorized");
  }
  const db = getAdminDb();
  
  // Fetch feedback for the current user
  const snapshot = await db.collection("ai_feedback")
    .where("userId", "==", user.uid)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const feedback = snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Map to include learning points if they were created from this feedback
  // (In a real scenario, we might have a link in the feedback doc)
  // For now, we'll return the raw feedback with a computed status

  return {
    feedback,
    timestamp: new Date().toISOString(),
  };
});
