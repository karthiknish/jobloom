import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";

// GET /api/app/users/[userId] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // For now, return mock user data
    // In a real implementation, this would fetch from Firestore
    const user = {
      _id: userId,
      userId: userId,
      email: decodedToken.email || "user@example.com",
      name: decodedToken.name || "User",
      isAdmin: false,
      createdAt: Date.now()
    };

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}