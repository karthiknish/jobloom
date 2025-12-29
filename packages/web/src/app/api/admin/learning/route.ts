import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { z } from "zod";

/**
 * GET /api/admin/learning
 * List all generated learning points
 */
export const GET = withApi({
  auth: "admin",
  rateLimit: "admin",
}, async () => {
  const db = getAdminDb();
  const snapshot = await db.collection("ai_learning_points")
    .orderBy("createdAt", "desc")
    .get();

  const learningPoints = snapshot.docs.map(doc => ({
    _id: doc.id,
    ...doc.data(),
  }));

  return { learningPoints };
});

/**
 * PUT /api/admin/learning
 * Update a learning point (e.g., status, priority)
 */
const updateLearningPointSchema = z.object({
  id: z.string(),
  status: z.enum(["new", "reviewed", "verified", "archived"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  primaryIssue: z.string().optional(),
  recommendation: z.string().optional(),
});

export const PUT = withApi({
  auth: "admin",
  rateLimit: "admin",
  bodySchema: updateLearningPointSchema,
}, async ({ body }) => {
  const db = getAdminDb();
  const { id, ...updates } = body;

  await db.collection("ai_learning_points").doc(id).update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  return { success: true };
});
