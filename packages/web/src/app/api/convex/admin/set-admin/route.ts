// app/api/convex/admin/set-admin/route.ts
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@jobloom/convex/convex/_generated/api";
import { Id } from "@jobloom/convex/convex/_generated/dataModel";

export async function POST(request: Request) {
  try {
    // Create a Convex HTTP client inside the function
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    const body = await request.json();
    const { userId, requesterId } = body;
    
    // Call the Convex function to set user as admin
    await convex.mutation(api.admin.setAdminUser, { 
      userId: userId as Id<"users">,
      requesterId: requesterId as Id<"users">
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting admin user:", error);
    return NextResponse.json(
      { error: "Failed to set admin user" },
      { status: 500 }
    );
  }
}