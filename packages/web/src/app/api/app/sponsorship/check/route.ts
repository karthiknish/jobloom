import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function POST(request: Request) {
  try {
    const { companies } = await request.json();
    if (!Array.isArray(companies)) {
      return NextResponse.json({ error: "companies must be an array" }, { status: 400 });
    }
    const db = getAdminDb();
    const lowerSet = new Set(
      companies
        .map((c: unknown) => (typeof c === "string" ? c.trim().toLowerCase() : ""))
        .filter(Boolean)
    );

    const snap = await db.collection("sponsoredCompanies").get();
    const results: Array<{ company: string; isSponsored: boolean; sponsorshipType: string | null; matchedName?: string }> = [];

    const sponsored: Array<{ name: string; type: string }> = snap.docs.map((d: any) => {
      const data = d.data() as any;
      return { name: String(data.name || data.company || ""), type: String(data.sponsorshipType || data.type || "sponsored") };
    });

    for (const name of lowerSet) {
      let matched = null as null | { name: string; type: string };
      for (const s of sponsored) {
        const n = s.name.trim().toLowerCase();
        if (n && (n === name || name.includes(n) || n.includes(name))) {
          matched = s;
          break;
        }
      }
      if (matched) {
        results.push({ company: name, isSponsored: true, sponsorshipType: matched.type || "sponsored", matchedName: matched.name });
      } else {
        results.push({ company: name, isSponsored: false, sponsorshipType: null });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error checking sponsorship:", error);
    return NextResponse.json({ error: "Failed to check sponsorship" }, { status: 500 });
  }
}
