// app/api/convex/sponsorship/rules/[ruleId]/status/route.ts
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@jobloom/convex/convex/_generated/api";
import { Id } from "@jobloom/convex/convex/_generated/dataModel";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ ruleId: string }> }
) {
  try {
    // Create a Convex HTTP client inside the function
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    const params = await context.params;
    const body = await request.json();
    const { isActive } = body;
    
    // Call the Convex function to update sponsorship rule status
    await convex.mutation(api.sponsorship.updateSponsorshipRuleStatus, { 
      ruleId: params.ruleId as Id<"sponsorshipRules">,
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