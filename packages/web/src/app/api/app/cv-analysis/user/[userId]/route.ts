import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { z } from "zod";

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
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
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
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const db = getAdminDb();
  
  // Verify the analysis belongs to the user
  const analysisRef = db.collection("cvAnalyses").doc(analysisId);
  const analysisDoc = await analysisRef.get();

  if (!analysisDoc.exists) {
    return NextResponse.json(
      { error: "Analysis not found" },
      { status: 404 }
    );
  }

  const analysisData = analysisDoc.data();
  if (analysisData?.userId !== userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  // Delete the analysis
  await analysisRef.delete();

  return { success: true, message: "Analysis deleted successfully" };
});
