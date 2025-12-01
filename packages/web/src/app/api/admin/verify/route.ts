import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";

// POST /api/admin/verify - Verify if current user has admin access
export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifySessionFromRequest(request);

    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin from Firestore using admin SDK
    const isAdmin = await isUserAdmin(decodedToken.uid);

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access denied" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        isAdmin: true,
      },
    });
  } catch (error) {
    console.error("Error verifying admin access:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
