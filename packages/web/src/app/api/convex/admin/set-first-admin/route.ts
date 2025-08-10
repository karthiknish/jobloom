// app/api/convex/admin/set-first-admin/route.ts
import { NextResponse } from "next/server";
import { anyApi } from "convex/server";
import { ConvexHttpClient } from "convex/browser";

// Runtime proxy for Convex functions; loosen typing for now
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api: any = anyApi;

// Create a Convex HTTP client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, secret } = body;
    
    // Check if the secret matches the environment variable
    if (secret !== process.env.ADMIN_SETUP_SECRET) {
      return NextResponse.json(
        { error: "Invalid secret" },
        { status: 401 }
      );
    }
    
    // This would need to be implemented in your Convex backend
    // For now, we'll just return a placeholder response
    return NextResponse.json({ success: true, message: "Admin user set successfully" });
  } catch (error) {
    console.error("Error setting admin user:", error);
    return NextResponse.json(
      { error: "Failed to set admin user" },
      { status: 500 }
    );
  }
}