// app/api/convex/sponsorship/rules/route.ts
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@jobloom/convex/convex/_generated/api";

export async function GET() {
  try {
    // Create a Convex HTTP client inside the function
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Call the Convex function to get all sponsorship rules
    const rules = await convex.query(api.sponsorship.getAllSponsorshipRules);
    
    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching sponsorship rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch sponsorship rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Create a Convex HTTP client inside the function
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    const body = await request.json();
    
    // Call the Convex function to add a new sponsorship rule
    const result = await convex.mutation(api.sponsorship.addSponsorshipRule, body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adding sponsorship rule:", error);
    return NextResponse.json(
      { error: "Failed to add sponsorship rule" },
      { status: 500 }
    );
  }
}