// app/api/convex/applications/route.ts
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
    // Call the Convex function to get applications
    const applications = await convex.query(api.applications.getApplicationsByUser, { 
      userId: params.userId as Id<"users">
    });
    
    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { status } = body;
    
    // Call the Convex function to update application status
    await convex.mutation(api.applications.updateApplicationStatus, { 
      applicationId: params.applicationId as Id<"applications">,
      status
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