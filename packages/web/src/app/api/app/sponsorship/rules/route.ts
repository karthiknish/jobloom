import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection("sponsorshipRules").get();
    const rules = snap.docs.map((d: any) => ({ _id: d.id, ...d.data() }));
    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching sponsorship rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch sponsorship rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = getAdminDb();
    const body = await request.json();
    const payload = { ...body, createdAt: Date.now(), updatedAt: Date.now() };
    const res = await db.collection("sponsorshipRules").add(payload);
    return NextResponse.json({ ruleId: res.id });
  } catch (error) {
    console.error("Error adding sponsorship rule:", error);
    return NextResponse.json(
      { error: "Failed to add sponsorship rule" },
      { status: 500 }
    );
  }
}
