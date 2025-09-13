import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function POST(request: Request) {
  try {
    const db = getAdminDb();
    const { userId } = await request.json();
    await db
      .collection("users")
      .doc(userId)
      .set({ isAdmin: true, updatedAt: Date.now() }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting admin user:", error);
    return NextResponse.json(
      { error: "Failed to set admin user" },
      { status: 500 }
    );
  }
}
