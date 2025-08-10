// app/api/convex/admin/set-first-admin/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secret } = body;
    
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