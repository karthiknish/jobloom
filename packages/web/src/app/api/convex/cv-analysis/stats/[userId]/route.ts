// app/api/convex/cv-analysis/stats/[userId]/route.ts
import { NextResponse } from "next/server";
import { anyApi } from "convex/server";
import { ConvexHttpClient } from "convex/browser";

// Runtime proxy for Convex functions; loosen typing for now
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api: any = anyApi;

// Create a Convex HTTP client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
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