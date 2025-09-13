import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getAdminDb();
    const payload = {
      title: body.title || "",
      company: body.company || "",
      location: body.location || "",
      url: body.url || "",
      description: body.description || "",
      salary: body.salary || "",
      isSponsored: !!body.isSponsored,
      isRecruitmentAgency: !!body.isRecruitmentAgency,
      source: body.source || "api",
      dateFound: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId: body.userId,
    };
    const ref = await db.collection("jobs").add(payload as any);
    return NextResponse.json({ jobId: ref.id });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
