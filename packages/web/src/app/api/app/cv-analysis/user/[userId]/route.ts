import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

// GET /api/app/cv-analysis/user/[userId] - Get CV analyses for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
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
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
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