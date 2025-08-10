// app/api/convex/admin/is-admin/[userId]/route.ts
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@jobloom/convex/convex/_generated/api";
import { Id } from "@jobloom/convex/convex/_generated/dataModel";

// Create a Convex HTTP client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    // Call the Convex function to check if user is admin
    const isAdmin = await convex.query(api.admin.isUserAdmin, { userId: userId as Id<"users"> });
    
    return NextResponse.json(isAdmin);
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      { error: "Failed to check admin status" },
      { status: 500 }
    );
  }
}