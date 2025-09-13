import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection("users").get();
    const users = snap.docs.map((d: any) => ({ _id: d.id, ...d.data() }));
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
