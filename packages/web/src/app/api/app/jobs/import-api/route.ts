import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, source, searchQuery, location } = body;

    if (!userId || !source) {
      return NextResponse.json(
        { error: "Missing required fields: userId and source" },
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

    const mockJobs = [
      {
        title: (searchQuery ? `${searchQuery} ` : "") + "Role",
        company: "DemoCorp",
        location: location || "Remote",
        url: `https://example.com/${source}/${Date.now()}`,
        isSponsored: Math.random() > 0.5,
        source,
      },
    ];

    let importedCount = 0;
    let skippedCount = 0;
    const importedJobIds: string[] = [];
    const skippedUrls: string[] = [];
    for (const j of mockJobs) {
      if (existingUrls.has(j.url)) {
        skippedCount++;
        skippedUrls.push(j.url);
        continue;
      }
      const payload = {
        ...j,
        description: "",
        salary: "",
        isRecruitmentAgency: false,
        dateFound: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userId,
      };
      const res = await db.collection("jobs").add(payload as any);
      importedCount++;
      importedJobIds.push(res.id);
      existingUrls.add(j.url);
    }
    return NextResponse.json({
      importedCount,
      skippedCount,
      importedJobIds,
      skippedUrls,
      source,
    });
  } catch (error) {
    console.error("Error importing jobs from API:", error);
    return NextResponse.json(
      { error: "Failed to import jobs from API" },
      { status: 500 }
    );
  }
}
