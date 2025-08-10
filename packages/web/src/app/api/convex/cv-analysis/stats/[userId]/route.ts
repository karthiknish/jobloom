// app/api/convex/cv-analysis/stats/[userId]/route.ts
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@jobloom/convex/convex/_generated/api";
import { Id } from "@jobloom/convex/convex/_generated/dataModel";

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // Create a Convex HTTP client inside the function
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    const params = await context.params;
    const stats = await convex.query(api.cvAnalysis.getCvAnalysisStats, {
      userId: params.userId as Id<"users">,
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