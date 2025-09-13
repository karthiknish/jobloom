import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const db = getAdminDb();
    const snap = await db.collection("users").doc(userId).get();
    const isAdmin = snap.exists ? !!(snap.data() as any)?.isAdmin : false;
    return NextResponse.json(isAdmin);
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      { error: "Failed to check admin status" },
      { status: 500 }
    );
  }
}
