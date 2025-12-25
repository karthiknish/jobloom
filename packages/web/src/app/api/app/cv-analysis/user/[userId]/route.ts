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

const toMillis = (value: unknown): number => {
  if (!value) return Date.now();
  if (typeof value === "number") return Number.isFinite(value) ? value : Date.now();
  if (typeof value === "string") {
    const n = /^\d+$/.test(value) ? Number(value) : new Date(value).getTime();
    return Number.isFinite(n) ? n : Date.now();
  }
  if (value instanceof Date) {
    const n = value.getTime();
    return Number.isFinite(n) ? n : Date.now();
  }
  if (typeof value === "object") {
    const anyVal = value as any;
    if (typeof anyVal.toMillis === "function") {
      const n = anyVal.toMillis();
      return typeof n === "number" && Number.isFinite(n) ? n : Date.now();
    }
    if (typeof anyVal.toDate === "function") {
      const d = anyVal.toDate();
      const n = d instanceof Date ? d.getTime() : NaN;
      return Number.isFinite(n) ? n : Date.now();
    }
    if (typeof anyVal.seconds === "number") {
      const nanos = typeof anyVal.nanoseconds === "number" ? anyVal.nanoseconds : 0;
      const n = anyVal.seconds * 1000 + Math.floor(nanos / 1_000_000);
      return Number.isFinite(n) ? n : Date.now();
    }
    if (typeof anyVal._seconds === "number") {
      const nanos = typeof anyVal._nanoseconds === "number" ? anyVal._nanoseconds : 0;
      const n = anyVal._seconds * 1000 + Math.floor(nanos / 1_000_000);
      return Number.isFinite(n) ? n : Date.now();
    }
  }
  return Date.now();
};

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
  // Avoid orderBy("createdAt") because legacy records may store createdAt as mixed types
  // (Timestamp vs number), which can make Firestore queries fail.
  const snapshot = await analysesRef.get();

  const analyses = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      _id: doc.id,
      userId: data.userId,
      fileName: data.fileName || "",
      fileSize: data.fileSize || 0,
      createdAt: toMillis(data.createdAt),
      analysisStatus: data.analysisStatus || data.status || "pending",
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

  return analyses.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
