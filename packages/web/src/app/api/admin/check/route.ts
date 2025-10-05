import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";

// GET /api/admin/check - Check if current user is admin
export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifySessionFromRequest(request);

    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin from Firestore using admin SDK
    const isAdmin = await isUserAdmin(decodedToken.uid);

    return NextResponse.json({
      isAdmin,
      userId: decodedToken.uid,
      email: decodedToken.email,
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
