// app/api/convex/sponsorship/stats/route.ts
import { NextResponse } from "next/server";
import { anyApi } from "convex/server";
import { ConvexHttpClient } from "convex/browser";

// Runtime proxy for Convex functions; loosen typing for now
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api: any = anyApi;

// Create a Convex HTTP client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    const stats = await convex.query(api.sponsorship.getSponsorshipStats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching sponsorship stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch sponsorship stats" },
      { status: 500 }
    );
  }
}