import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";

// GET /api/app/cv-analysis/stats/[userId] - Get CV analysis stats for a user
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

    // For now, return mock CV analysis stats
    // In a real implementation, this would fetch from Firestore
    const stats = {
      totalAnalyses: 0,
      completedAnalyses: 0,
      averageScore: 0,
      recentAnalysis: null
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching CV analysis stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}