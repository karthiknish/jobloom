import { NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection("sponsoredCompanies").get();
    const companies = snap.docs.map((d: any) => d.data() as any);
    const industryStats: Record<string, number> = {};
    const sponsorshipTypeStats: Record<string, number> = {};
    for (const c of companies) {
      const ind = c.industry || "Unknown";
      industryStats[ind] = (industryStats[ind] ?? 0) + 1;
      const type = c.sponsorshipType || "sponsored";
      sponsorshipTypeStats[type] = (sponsorshipTypeStats[type] ?? 0) + 1;
    }
    return NextResponse.json({
      totalSponsoredCompanies: companies.length,
      industryStats,
      sponsorshipTypeStats,
    });
  } catch (error) {
    console.error("Error fetching sponsorship stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch sponsorship stats" },
      { status: 500 }
    );
  }
}
