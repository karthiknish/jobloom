import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";

// GET /api/app/cv-analysis/user/[userId] - Get CV analyses for a user
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

    // For now, return empty array (no CV analyses)
    // In a real implementation, this would fetch from Firestore
    const analyses: any[] = [];

    return NextResponse.json(analyses);
  } catch (error) {
    console.error("Error fetching CV analyses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}