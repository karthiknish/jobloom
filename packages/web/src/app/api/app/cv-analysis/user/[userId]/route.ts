import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { z } from "zod";
import { AuthorizationError, NotFoundError } from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";

const cvParamsSchema = z.object({
  userId: z.string(),
});

const deleteQuerySchema = z.object({
  analysisId: z.string().min(1, "Missing analysisId parameter"),
});

// GET /api/app/cv-analysis/user/[userId] - Get CV analyses for a user
export const GET = withApi({
  auth: 'required',
  paramsSchema: cvParamsSchema,
}, async ({ params, user }) => {
  const { userId } = params;
  
  if (user!.uid !== userId && !user!.isAdmin) {
    throw new AuthorizationError(
      "Access denied. You can only access your own CV analyses.",
      "FORBIDDEN"
    );
  }

  const db = getAdminDb();
  
  // Fetch CV analyses from Firestore
  const analysesRef = db
    .collection("cvAnalyses")
    .where("userId", "==", userId);
  const snapshot = await analysesRef.orderBy("createdAt", "desc").get();

  const analyses = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      _id: doc.id,
      userId: data.userId,
      fileName: data.fileName || "",
      fileSize: data.fileSize || 0,
      createdAt: data.createdAt?.toMillis() || Date.now(),
      analysisStatus: data.analysisStatus || "pending",
      overallScore: data.overallScore || undefined,
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
      recommendations: data.recommendations || [],
      missingSkills: data.missingSkills || [],
      atsCompatibility: data.atsCompatibility || undefined,
      keywordAnalysis: data.keywordAnalysis || undefined,
      sectionAnalysis: data.sectionAnalysis || undefined,
      industryAlignment: data.industryAlignment || undefined,
      targetRole: data.targetRole || undefined,
      industry: data.industry || undefined,
      errorMessage: data.errorMessage || undefined,
    };
  });

  return analyses;
});

// DELETE /api/app/cv-analysis/user/[userId] - Delete a CV analysis
export const DELETE = withApi({
  auth: 'required',
  paramsSchema: cvParamsSchema,
  querySchema: deleteQuerySchema,
}, async ({ params, query, user }) => {
  const { userId } = params;
  const { analysisId } = query;
  
  if (user!.uid !== userId && !user!.isAdmin) {
    throw new AuthorizationError(
      "Access denied. You can only delete your own CV analyses.",
      "FORBIDDEN"
    );
  }

  const db = getAdminDb();
  
  // Verify the analysis belongs to the user
  const analysisRef = db.collection("cvAnalyses").doc(analysisId);
  const analysisDoc = await analysisRef.get();

  if (!analysisDoc.exists) {
    throw new NotFoundError(
      "Analysis not found",
      "cv-analysis",
      ERROR_CODES.CV_NOT_FOUND
    );
  }

  const analysisData = analysisDoc.data();
  if (analysisData?.userId !== userId) {
    throw new AuthorizationError(
      "You do not have permission to delete this analysis",
      "FORBIDDEN"
    );
  }

  // Delete the analysis
  await analysisRef.delete();

  return { success: true, message: "Analysis deleted successfully" };
});

export { OPTIONS } from "@/lib/api/withApi";
