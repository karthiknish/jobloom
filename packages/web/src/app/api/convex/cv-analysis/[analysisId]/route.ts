// app/api/convex/cv-analysis/[analysisId]/route.ts
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@jobloom/convex/convex/_generated/api";
import { Id } from "@jobloom/convex/convex/_generated/dataModel";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ analysisId: string }> }
) {
  try {
    // Create a Convex HTTP client inside the function
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    const params = await context.params;
    await convex.mutation(api.cvAnalysis.deleteCvAnalysis, {
      analysisId: params.analysisId as Id<"cvAnalyses">,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting CV analysis:", error);
    return NextResponse.json(
      { error: "Failed to delete CV analysis" },
      { status: 500 }
    );
  }
}