import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";

// GET /api/app/admin/is-admin/[userId] - Check if user is admin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    

    // For now, return false for all users (no admin users configured)
    // In a real implementation, this would check Firestore for admin status
    const isAdmin = false;

    return NextResponse.json(isAdmin);
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}