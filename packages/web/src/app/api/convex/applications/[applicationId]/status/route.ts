// app/api/convex/applications/[applicationId]/status/route.ts
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@jobloom/convex/convex/_generated/api";
import { Id } from "@jobloom/convex/convex/_generated/dataModel";

// Create a Convex HTTP client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { status } = body;
    
    await convex.mutation(api.applications.updateApplicationStatus, {
      applicationId: params.applicationId as Id<"applications">,
      status,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating application status:", error);
    return NextResponse.json(
      { error: "Failed to update application status" },
      { status: 500 }
    );
  }
}