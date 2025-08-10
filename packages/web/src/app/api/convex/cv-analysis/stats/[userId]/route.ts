// app/api/convex/cv-analysis/stats/[userId]/route.ts
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@jobloom/convex/convex/_generated/api";

// Create a Convex HTTP client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    const stats = await convex.query(api.cvAnalysis.getCvAnalysisStats, {
      userId: params.userId,
    });
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching CV analysis stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch CV analysis stats" },
      { status: 500 }
    );
  }
}