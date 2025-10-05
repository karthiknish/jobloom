import { NextRequest, NextResponse } from "next/server";
import { getAdminApp, verifyIdToken, getAdminAuth } from "@/firebase/admin";

interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export async function GET(request: NextRequest) {
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

    // Get user info from Firebase Auth
    const auth = getAdminAuth();
    const user = await auth.getUser(decodedToken.uid);

    // Extract session information from user metadata and tokens
    const sessions: SessionInfo[] = [];
    
    // Current session (the one making this request)
    const currentSession: SessionInfo = {
      id: 'current',
      device: 'Current Device',
      browser: request.headers.get('user-agent') || 'Unknown Browser',
      location: 'Unknown Location',
      lastActive: new Date().toISOString(),
      isCurrent: true
    };
    
    sessions.push(currentSession);

    // Note: Firebase Auth doesn't provide a way to list all active sessions
    // This is a limitation of Firebase Auth. For a complete session management
    // system, you would need to implement custom session tracking
    // using a database to store session information.

    return NextResponse.json({
      sessions,
      note: "Firebase Auth limitations prevent listing all active sessions. Only the current session is shown."
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Note: Firebase Auth doesn't support revoking individual sessions
    // Only all sessions can be revoked via revokeRefreshTokens
    // This endpoint is structured for future custom session implementation

    return NextResponse.json({
      success: false,
      message: "Individual session revocation is not supported by Firebase Auth. Use 'Revoke All Sessions' instead."
    }, { status: 400 });
  } catch (error) {
    console.error("Error revoking session:", error);
    return NextResponse.json({ error: "Failed to revoke session" }, { status: 500 });
  }
}