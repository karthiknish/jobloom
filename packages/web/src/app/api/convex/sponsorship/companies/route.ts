// app/api/convex/sponsorship/companies/route.ts
import { NextResponse } from "next/server";
import { anyApi } from "convex/server";
import { ConvexHttpClient } from "convex/browser";

// Runtime proxy for Convex functions; loosen typing for now
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api: any = anyApi;

// Create a Convex HTTP client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    const companies = await convex.query(api.sponsorship.getAllSponsoredCompanies);
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
    
    const companyId = await convex.mutation(api.sponsorship.addSponsoredCompany, body);
    
    return NextResponse.json({ companyId });
  } catch (error) {
    console.error("Error adding sponsored company:", error);
    return NextResponse.json(
      { error: "Failed to add sponsored company" },
      { status: 500 }
    );
  }
}