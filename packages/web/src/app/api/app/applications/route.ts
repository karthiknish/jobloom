import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function POST(request: Request) {
  try {
    const db = getAdminDb();
    const body = await request.json();
    const payload = {
      jobId: String(body.jobId || ""),
      userId: String(body.userId || ""),
      status: String(body.status || "interested"),
      appliedDate:
        typeof body.appliedDate === "number" ? body.appliedDate : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (!payload.jobId || !payload.userId) {
      return NextResponse.json(
        { error: "Missing jobId or userId" },
        { status: 400 }
      );
    }
    const ref = await db.collection("applications").add(payload as any);
    return NextResponse.json({ applicationId: ref.id });
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
