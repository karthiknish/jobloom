// app/api/convex/sponsorship/rules/[ruleId]/status/route.ts
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@jobloom/convex/convex/_generated/api";
import { Id } from "@jobloom/convex/convex/_generated/dataModel";

// Create a Convex HTTP client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function PATCH(
  request: Request,
  { params }: { params: { ruleId: string } }
) {
  try {
    const body = await request.json();
    const { ruleId } = params;
    const { isActive } = body;
    
    // Call the Convex function to update sponsorship rule status
    await convex.mutation(api.sponsorship.updateSponsorshipRuleStatus, { 
      ruleId: ruleId as Id<"sponsorshipRules">,
      isActive 
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating sponsorship rule status:", error);
    return NextResponse.json(
      { error: "Failed to update sponsorship rule status" },
      { status: 500 }
    );
  }
}