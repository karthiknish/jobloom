// app/api/convex/cv-analysis/user/[userId]/route.ts
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@jobloom/convex/convex/_generated/api";
import { Id } from "@jobloom/convex/convex/_generated/dataModel";

// Create a Convex HTTP client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    const analyses = await convex.query(api.cvAnalysis.getUserCvAnalyses, {
      userId: params.userId as Id<"users">,
    });
    
    return NextResponse.json(analyses);
  } catch (error) {
    console.error("Error fetching CV analyses:", error);
    return NextResponse.json(
      { error: "Failed to fetch CV analyses" },
      { status: 500 }
    );
  }
}