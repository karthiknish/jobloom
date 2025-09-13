import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function GET(_req: Request, ctx: any) {
  try {
    const db = getAdminDb();
    const { userId } = ctx.params || {};
    const ref = db.collection("user_settings").doc(userId);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : {};
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: any) {
  try {
    const db = getAdminDb();
    const { userId } = ctx.params || {};
    const payload = await req.json().catch(() => ({}));
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
    }
    const ref = db.collection("user_settings").doc(userId);
    await ref.set({ ...payload, updatedAt: Date.now() }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to save settings" }, { status: 500 });
  }
}
