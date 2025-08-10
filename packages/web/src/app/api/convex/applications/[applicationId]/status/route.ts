// app/api/convex/applications/[applicationId]/status/route.ts
import { NextResponse } from "next/server";
import { anyApi } from "convex/server";
import { ConvexHttpClient } from "convex/browser";

// Runtime proxy for Convex functions; loosen typing for now
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api: any = anyApi;

// Create a Convex HTTP client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function PATCH(
  request: Request,
  { params }: { params: { applicationId: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;
    
    await convex.mutation(api.applications.updateApplicationStatus, {
      applicationId: params.applicationId,
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