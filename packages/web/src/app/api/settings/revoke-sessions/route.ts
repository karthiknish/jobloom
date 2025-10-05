import { NextRequest, NextResponse } from "next/server";
import { getAdminApp, verifyIdToken, getAdminAuth } from "@/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken?.uid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const auth = getAdminAuth();
    await auth.revokeRefreshTokens(decodedToken.uid);

    return NextResponse.json({
      success: true,
      message: "All active sessions have been revoked. Some devices may take up to a minute to sign out.",
    });
  } catch (error) {
    console.error("Error revoking sessions:", error);
    return NextResponse.json({ error: "Failed to revoke sessions" }, { status: 500 });
  }
}
