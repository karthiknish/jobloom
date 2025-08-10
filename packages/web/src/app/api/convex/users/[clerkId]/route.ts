// app/api/convex/users/[clerkId]/route.ts
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@jobloom/convex/convex/_generated/api";

export async function GET(
  request: Request,
  context: { params: Promise<{ clerkId: string }> }
) {
  try {
    // Create a Convex HTTP client inside the function
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    const params = await context.params;
    const user = await convex.query(api.users.getUserByClerkId, {
      clerkId: params.clerkId,
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}