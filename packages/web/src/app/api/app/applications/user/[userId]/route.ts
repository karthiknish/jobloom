import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const db = getAdminDb();
    const snap = await db
      .collection("applications")
      .where("userId", "==", userId)
      .get();
    const applications = snap.docs.map((d: any) => ({
      _id: d.id,
      ...d.data(),
    }));
    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
