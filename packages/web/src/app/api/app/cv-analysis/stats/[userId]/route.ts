import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const db = getAdminDb();
    const { userId } = await context.params;
    const snap = await db
      .collection("cvAnalyses")
      .where("userId", "==", userId)
      .get();
    let total = 0,
      completed = 0,
      sumScore = 0,
      keywordSum = 0;
    let recent: any = null;
    snap.forEach((d: any) => {
      const x = d.data() as any;
      total += 1;
      const status = x.analysisStatus ?? "completed";
      if (status === "completed") completed += 1;
      if (typeof x.overallScore === "number") sumScore += x.overallScore;
      if (Array.isArray(x.keywords)) keywordSum += x.keywords.length;
      const createdAt = x.createdAt ?? 0;
      if (!recent || createdAt > recent.createdAt)
        recent = { _id: d.id, ...x, createdAt };
    });
    const averageScore = total ? Math.round((sumScore / total) * 100) / 100 : 0;
    const averageKeywords = total
      ? Math.round((keywordSum / total) * 100) / 100
      : 0;
    const successRate = total ? Math.round((completed / total) * 100) : 0;
    return NextResponse.json({
      total,
      averageScore,
      averageKeywords,
      successRate,
      recentAnalysis: recent,
      totalAnalyses: total,
      completedAnalyses: completed,
    });
  } catch (error) {
    console.error("Error fetching CV analysis stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch CV analysis stats" },
      { status: 500 }
    );
  }
}
