import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";

// Temporary in-memory mock sponsors (previously public). Replace with Firestore later.
const mockSponsors = [
  { name: "Google", city: "London", route: "Skilled Worker", typeRating: "AA", isSkilledWorker: true },
  { name: "Microsoft", city: "Reading", route: "Skilled Worker", typeRating: "AA", isSkilledWorker: true },
  { name: "Amazon", city: "London", route: "Skilled Worker", typeRating: "AA", isSkilledWorker: true },
  { name: "Meta", city: "London", route: "Skilled Worker", typeRating: "AA", isSkilledWorker: true },
  { name: "Netflix", city: "London", route: "Skilled Worker", typeRating: "AA", isSkilledWorker: true },
  { name: "Apple", city: "London", route: "Skilled Worker", typeRating: "AA", isSkilledWorker: true },
  { name: "Tesla", city: "London", route: "Skilled Worker", typeRating: "AA", isSkilledWorker: true },
  { name: "IBM", city: "London", route: "Skilled Worker", typeRating: "AA", isSkilledWorker: true },
];

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = await verifyIdToken(token);
    return decoded || null;
  } catch {
    return null;
  }
}

// GET /api/app/sponsorship/companies?q=Google&city=London&route=Skilled+Worker&limit=1
export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase().trim();
    const city = searchParams.get("city")?.toLowerCase().trim();
    const route = searchParams.get("route")?.toLowerCase().trim();
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    let results = mockSponsors;
    if (q) {
      results = results.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (city) {
      results = results.filter((s) => s.city.toLowerCase().includes(city));
    }
    if (route) {
      results = results.filter((s) => s.route.toLowerCase().includes(route));
    }
    results = results.slice(0, limit);

    return NextResponse.json({
      success: true,
      totalResults: results.length,
      results: results.map((s) => ({
        name: s.name,
        city: s.city,
        route: s.route,
        typeRating: s.typeRating,
        isSkilledWorker: s.isSkilledWorker,
      })),
    });
  } catch (error) {
    console.error("Error fetching sponsored companies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/app/sponsorship/companies - Add sponsored company (mock)
export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    console.log("(Mock) Adding sponsored company:", data);
    return NextResponse.json({ companyId: "mock-company-id" });
  } catch (error) {
    console.error("Error adding sponsored company:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}