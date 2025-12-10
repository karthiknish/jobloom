import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { getAdminDb } from "@/firebase/admin";

// POST /api/cv/user - ensure user doc exists & return minimal user record
export const POST = withAuth(
  async (request, { user }) => {
    try {
      const db = getAdminDb();
      const ref = db.collection("users").doc(user.uid);
      const snap = await ref.get();
      
      if (!snap.exists) {
        await ref.set({
          email: user.email ?? "",
          name: user.name ?? "",
          createdAt: Date.now(),
          isAdmin: false,
        }, { merge: true });
      }
      
      return NextResponse.json({ _id: user.uid });
    } catch (error) {
      console.error("/api/cv/user POST error", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);

// GET /api/cv/user - fetch current user doc
export const GET = withAuth(
  async (request, { user }) => {
    try {
      const db = getAdminDb();
      const ref = db.collection("users").doc(user.uid);
      const snap = await ref.get();
      
      if (!snap.exists) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ _id: user.uid });
    } catch (error) {
      console.error("/api/cv/user GET error", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
