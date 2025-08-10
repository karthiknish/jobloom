// app/api/convex/cv-analysis/user/[userId]/route.ts
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
    const analyses = await convex.query(api.cvAnalysis.getUserCvAnalyses, {
      userId: params.userId,
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