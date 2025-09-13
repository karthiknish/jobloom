import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ ruleId: string }> }
) {
  try {
    const db = getAdminDb();
    const { ruleId } = await context.params;
    const { isActive } = await request.json();
    await db.collection("sponsorshipRules").doc(ruleId).update({
      isActive,
      updatedAt: Date.now(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating sponsorship rule status:", error);
    return NextResponse.json(
      { error: "Failed to update sponsorship rule status" },
      { status: 500 }
    );
  }
}
