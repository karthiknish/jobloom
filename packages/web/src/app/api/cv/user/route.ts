import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, verifyIdToken } from "@/firebase/admin";

// POST /api/cv/user - ensure user doc exists & return minimal user record
// GET  /api/cv/user  - fetch current user doc
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const decoded = await verifyIdToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const db = getAdminDb();
    const ref = db.collection("users").doc(decoded.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        email: decoded.email ?? "",
        name: decoded.name ?? "",
        createdAt: Date.now(),
        isAdmin: false,
      }, { merge: true });
    }
    return NextResponse.json({ _id: decoded.uid });
  } catch (error) {
    console.error("/api/cv/user POST error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const decoded = await verifyIdToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const db = getAdminDb();
    const ref = db.collection("users").doc(decoded.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ _id: decoded.uid });
  } catch (error) {
    console.error("/api/cv/user GET error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
