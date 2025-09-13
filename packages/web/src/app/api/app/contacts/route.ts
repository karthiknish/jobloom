import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;
    const db = getAdminDb();
    await db.collection("contacts").add({
      name,
      email,
      message,
      createdAt: Date.now(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
