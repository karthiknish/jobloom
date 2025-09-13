import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection("sponsoredCompanies").get();
    const companies = snap.docs.map((d: any) => ({ _id: d.id, ...d.data() }));
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching sponsored companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch sponsored companies" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getAdminDb();
    const payload = {
      ...body,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    };
    const res = await db.collection("sponsoredCompanies").add(payload);
    return NextResponse.json({ companyId: res.id });
  } catch (error) {
    console.error("Error adding sponsored company:", error);
    return NextResponse.json(
      { error: "Failed to add sponsored company" },
      { status: 500 }
    );
  }
}
