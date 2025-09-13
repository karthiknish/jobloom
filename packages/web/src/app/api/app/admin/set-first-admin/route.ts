import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secret } = body;
    
    if (secret !== process.env.ADMIN_SETUP_SECRET) {
      return NextResponse.json(
        { error: "Invalid secret" },
        { status: 401 }
      );
    }
    
    const db = getAdminDb();
    const adminSnap = await db
      .collection("users")
      .where("isAdmin", "==", true)
      .limit(1)
      .get();
    if (!adminSnap.empty) {
      return NextResponse.json({
        success: true,
        message: "An admin already exists",
      });
    }
    const { userId } = body as { userId?: string };
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    await db
      .collection("users")
      .doc(userId)
      .set({ isAdmin: true, updatedAt: Date.now() }, { merge: true });
    return NextResponse.json({ success: true, message: "Admin user set successfully" });
  } catch (error) {
    console.error("Error setting admin user:", error);
    return NextResponse.json(
      { error: "Failed to set admin user" },
      { status: 500 }
    );
  }
}
