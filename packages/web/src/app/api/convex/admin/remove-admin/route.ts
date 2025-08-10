// app/api/convex/admin/remove-admin/route.ts
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@jobloom/convex/convex/_generated/api";
import { Id } from "@jobloom/convex/convex/_generated/dataModel";

// Create a Convex HTTP client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, requesterId } = body;
    
    // Call the Convex function to remove admin privileges
    await convex.mutation(api.admin.removeAdminUser, { 
      userId: userId as Id<"users">,
      requesterId: requesterId as Id<"users">
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing admin user:", error);
    return NextResponse.json(
      { error: "Failed to remove admin user" },
      { status: 500 }
    );
  }
}