import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, jobs } = body;

    if (!userId || !jobs || !Array.isArray(jobs)) {
      return NextResponse.json(
        { error: "Missing required fields: userId and jobs array" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const existingSnap = await db
      .collection("jobs")
      .where("userId", "==", userId)
      .get();
    const existingUrls = new Set(
      existingSnap.docs.map((d: any) => (d.data() as any).url).filter(Boolean)
    );
    let importedCount = 0;
    let skippedCount = 0;
    const importedJobIds: string[] = [];
    const skippedUrls: string[] = [];
    for (const j of jobs as any[]) {
      const url = j.url || "";
      if (!url || existingUrls.has(url)) {
        skippedCount++;
        if (url) skippedUrls.push(url);
        continue;
      }
      const payload = {
        title: j.title || "",
        company: j.company || "",
        location: j.location || "",
        url,
        description: j.description || "",
        salary: j.salary || "",
        isSponsored: !!j.isSponsored,
        isRecruitmentAgency: !!j.isRecruitmentAgency,
        source: j.source || "csv",
        dateFound: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userId,
      };
      const res = await db.collection("jobs").add(payload as any);
      importedCount++;
      importedJobIds.push(res.id);
      existingUrls.add(url);
    }
    return NextResponse.json({
      importedCount,
      skippedCount,
      importedJobIds,
      skippedUrls,
      source: "csv",
    });
  } catch (error) {
    console.error("Error importing jobs:", error);
    return NextResponse.json(
      { error: "Failed to import jobs" },
      { status: 500 }
    );
  }
}
