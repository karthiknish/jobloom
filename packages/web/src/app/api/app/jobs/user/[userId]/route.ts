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
      .collection("jobs")
      .where("userId", "==", userId)
      .get();
    const jobs = snap.docs.map((d: any) => ({ _id: d.id, ...d.data() }));
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs by user:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
