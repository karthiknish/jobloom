import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const db = getAdminDb();
    const { userId } = await context.params;
    const snap = await db
      .collection("cvAnalyses")
      .where("userId", "==", userId)
      .get();
    const results = snap.docs.map((d: any) => ({ _id: d.id, ...d.data() }));
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching CV analyses:", error);
    return NextResponse.json(
      { error: "Failed to fetch CV analyses" },
      { status: 500 }
    );
  }
}
