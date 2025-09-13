import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    const db = getAdminDb();
    const ref = db.collection("users").doc(params.userId);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({ createdAt: Date.now() }, { merge: true });
      return NextResponse.json({ _id: params.userId });
    }
    const data = snap.data();
    return NextResponse.json({ _id: snap.id, ...data });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
