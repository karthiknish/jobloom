import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { z } from "zod";
import { AuthorizationError } from "@/lib/api/errorResponse";

const statsParamsSchema = z.object({
  userId: z.string(),
});

// GET /api/app/cv-analysis/stats/[userId] - Get CV analysis stats for a user
export const GET = withApi({
  auth: 'required',
  paramsSchema: statsParamsSchema,
}, async ({ params, user }) => {
  const { userId } = params;
  
  if (user!.uid !== userId && !user!.isAdmin) {
    throw new AuthorizationError(
      "Access denied. You can only access your own CV analysis stats.",
      "FORBIDDEN"
    );
  }

  const db = getAdminDb();
  
  // Fetch CV analyses from Firestore
  const analysesRef = db
    .collection("cvAnalyses")
    .where("userId", "==", userId);
  const snapshot = await analysesRef.orderBy("createdAt", "desc").get();

  let total = 0;
  let completed = 0;
  let sumScore = 0;
  let keywordSum = 0;
  let recent: any = null;

  snapshot.forEach((doc) => {
    const data = doc.data();
    total += 1;

    const status = data.analysisStatus || "pending";
    if (status === "completed") completed += 1;

    if (typeof data.overallScore === "number") sumScore += data.overallScore;

    if (data.keywordAnalysis?.presentKeywords) {
      keywordSum += data.keywordAnalysis.presentKeywords.length;
    }

    const candidate = {
      _id: doc.id,
      userId: data.userId,
      fileName: data.fileName || "",
      fileSize: data.fileSize || 0,
      createdAt: data.createdAt?.toMillis() || Date.now(),
      analysisStatus: status,
      overallScore: data.overallScore || undefined,
      strengths: data.strengths || [],
      atsCompatibility: data.atsCompatibility || undefined,
      errorMessage: data.errorMessage || undefined,
    };

    if (!recent || candidate.createdAt > recent.createdAt) recent = candidate;
  });

  const averageScore = total ? Math.round((sumScore / total) * 100) / 100 : 0;
  const averageKeywords = total
    ? Math.round((keywordSum / total) * 100) / 100
    : 0;
  const successRate = total ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    averageScore,
    averageKeywords,
    successRate,
    totalAnalyses: total,
    completedAnalyses: completed,
    recentAnalysis: recent,
  };
});

export { OPTIONS } from "@/lib/api/withApi";
