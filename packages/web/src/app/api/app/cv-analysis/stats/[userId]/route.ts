import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { authenticateRequest } from "@/lib/api/auth";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

// GET /api/app/cv-analysis/stats/[userId] - Get CV analysis stats for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const auth = await authenticateRequest(request, { loadUser: true });
    if (!auth.ok) {
      return auth.response;
    }

    if (auth.token.uid !== userId && !auth.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    const stats = {
      total,
      averageScore,
      averageKeywords,
      successRate,
      totalAnalyses: total,
      completedAnalyses: completed,
      recentAnalysis: recent,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching CV analysis stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}