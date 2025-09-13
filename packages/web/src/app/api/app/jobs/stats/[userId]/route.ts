import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const db = getAdminDb();
    const { userId } = await context.params;
    const [jobsSnap, appsSnap] = await Promise.all([
      db.collection("jobs").where("userId", "==", userId).get(),
      db.collection("applications").where("userId", "==", userId).get(),
    ]);
    let sponsoredJobs = 0;
    let recruitmentAgencyJobs = 0;
    let jobsToday = 0;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const startTs = start.getTime();
    jobsSnap.forEach((d: any) => {
      const j = d.data() as any;
      if (j.isSponsored) sponsoredJobs++;
      if (j.isRecruitmentAgency) recruitmentAgencyJobs++;
      const ts = j.dateFound ?? j.createdAt ?? 0;
      if (typeof ts === "number" && ts >= startTs) jobsToday++;
    });
    const byStatus: Record<string, number> = {};
    appsSnap.forEach((d: any) => {
      const s = (d.data() as any).status ?? "interested";
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    });
    return NextResponse.json({
      totalJobs: jobsSnap.size,
      sponsoredJobs,
      totalApplications: appsSnap.size,
      jobsToday,
      recruitmentAgencyJobs,
      byStatus,
    });
  } catch (error) {
    console.error("Error fetching job stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch job stats" },
      { status: 500 }
    );
  }
}
