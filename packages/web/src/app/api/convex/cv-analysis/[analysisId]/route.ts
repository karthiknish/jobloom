// app/api/convex/cv-analysis/[analysisId]/route.ts
import { NextResponse } from "next/server";
import { anyApi } from "convex/server";
import { ConvexHttpClient } from "convex/browser";

// Runtime proxy for Convex functions; loosen typing for now
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api: any = anyApi;

// Create a Convex HTTP client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function DELETE(
  request: Request,
  { params }: { params: { analysisId: string } }
) {
  try {
    await convex.mutation(api.cvAnalysis.deleteCvAnalysis, {
      analysisId: params.analysisId,
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