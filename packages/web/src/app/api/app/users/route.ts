import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";

// GET /api/app/users - Get all users (admin only)
export async function GET(request: NextRequest) {
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

    // For now, return mock users data
    // In a real implementation, this would fetch from Firestore
    const users = [
      {
        _id: decodedToken.uid,
        email: decodedToken.email || "user@example.com",
        name: decodedToken.name || "User",
        isAdmin: false,
        createdAt: Date.now()
      }
    ];

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}