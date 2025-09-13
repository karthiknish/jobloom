import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ analysisId: string }> }
) {
  try {
    const { analysisId } = await context.params;
    const db = getAdminDb();
    await db.collection("cvAnalyses").doc(analysisId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting CV analysis:", error);
    return NextResponse.json(
      { error: "Failed to delete CV analysis" },
      { status: 500 }
    );
  }
}
