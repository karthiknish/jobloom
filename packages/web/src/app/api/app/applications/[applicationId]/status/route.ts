import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const db = getAdminDb();
    const { applicationId } = await context.params;
    const { status } = await request.json();
    await db.collection("applications").doc(applicationId).update({
      status,
      updatedAt: Date.now(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating application status:", error);
    return NextResponse.json(
      { error: "Failed to update application status" },
      { status: 500 }
    );
  }
}
