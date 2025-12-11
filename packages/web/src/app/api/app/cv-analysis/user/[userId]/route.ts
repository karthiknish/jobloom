import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { authenticateRequest } from "@/lib/api/auth";

// Get Firestore instance using the centralized admin initialization
const db = getAdminDb();

// GET /api/app/cv-analysis/user/[userId] - Get CV analyses for a user
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

    return NextResponse.json(analyses);
  } catch (error) {
    console.error("Error fetching CV analyses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/app/cv-analysis/user/[userId] - Delete a CV analysis
export async function DELETE(
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

    const url = new URL(request.url);
    const analysisId = url.searchParams.get("analysisId");

    if (!analysisId) {
      return NextResponse.json({ error: "Missing analysisId parameter" }, { status: 400 });
    }

    // Verify the analysis belongs to the user
    const analysisRef = db.collection("cvAnalyses").doc(analysisId);
    const analysisDoc = await analysisRef.get();

    if (!analysisDoc.exists) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    const analysisData = analysisDoc.data();
    if (analysisData?.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the analysis
    await analysisRef.delete();

    return NextResponse.json({ success: true, message: "Analysis deleted successfully" });
  } catch (error) {
    console.error("Error deleting CV analysis:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}