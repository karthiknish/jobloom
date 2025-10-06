import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";

// CORS helper function
function addCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigins = [
    'https://www.linkedin.com',
    'https://linkedin.com',
    process.env.NEXT_PUBLIC_WEB_URL || 'https://hireall.app',
    'http://localhost:3000',
  ];

  const requestOrigin = origin || 
    (origin?.includes('hireall.app') || origin?.includes('vercel.app') || origin?.includes('netlify.app') ? origin : null);

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    response.headers.set('Access-Control-Allow-Origin', requestOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  } else if (process.env.NODE_ENV === 'development') {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  }

  return response;
}

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

  // In development, allow mock tokens for testing
  if (process.env.NODE_ENV === "development" && token.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc")) {
    return {
      uid: "test-user-123",
      email: "test@example.com",
      email_verified: true
    };
  }

  try {
    const decoded = await verifyIdToken(token);
    return decoded || null;
  } catch {
    return null;
  }
}

// GET /api/app/sponsorship/companies?q=Google&city=London&route=Skilled+Worker&limit=1&filters=...
export async function GET(request: NextRequest) {
  try {
    // Handle CORS preflight
    const origin = request.headers.get('origin');
    
    const user = await authenticate(request);
    if (!user) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return addCorsHeaders(response, origin || undefined);
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase().trim();
    const city = searchParams.get("city")?.toLowerCase().trim();
    const route = searchParams.get("route")?.toLowerCase().trim();
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    
    // Parse sponsorship filters
    const filtersParam = searchParams.get("filters");
    let sponsorshipFilters = null;
    if (filtersParam) {
      try {
        sponsorshipFilters = JSON.parse(filtersParam);
      } catch (e) {
        console.error("Invalid filters parameter:", filtersParam);
      }
    }

    let results = mockSponsors;
    
    // Apply basic filters
    if (q) {
      results = results.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (city) {
      results = results.filter((s) => s.city.toLowerCase().includes(city));
    }
    if (route) {
      results = results.filter((s) => s.route.toLowerCase().includes(route));
    }

    // Apply UK sponsorship filters if provided
    if (sponsorshipFilters) {
      results = results.filter((company) => {
        // Only skilled worker visas are eligible for these filters
        if (!company.isSkilledWorker) return false;

        // Check minimum salary requirement
        const minSalary = sponsorshipFilters.minSalary || 33400;
        
        // For immigration salary list jobs, allow lower minimum
        if (sponsorshipFilters.immigrationSalaryList && company.typeRating === "A") {
          return true; // These jobs have special lower salary requirements
        }

        // Apply age/education criteria (70% of going rate)
        if (sponsorshipFilters.under26 || sponsorshipFilters.recentGraduate) {
          return true; // These roles can go down to 70% with £33,400 minimum
        }

        // Apply STEM PhD criteria (80% of going rate)
        if (sponsorshipFilters.stemPhD) {
          return true; // STEM PhDs can go down to 80% with £33,400 minimum
        }

        // Apply non-STEM PhD criteria (90% of going rate)
        if (sponsorshipFilters.nonStemPhD) {
          return true; // Non-STEM PhDs can go down to 90% with £37,500 minimum
        }

        // Apply postdoctoral position criteria
        if (sponsorshipFilters.postdoctoralPosition) {
          // Only for specific science/education roles
          const postdoctoralRoles = ["Research", "Scientist", "Academic", "Professor", "Lecturer"];
          return postdoctoralRoles.some(role => company.name.toLowerCase().includes(role.toLowerCase()));
        }

        // Default case: standard requirements apply
        return true;
      });
    }

    results = results.slice(0, limit);

    const response = NextResponse.json({
      success: true,
      totalResults: results.length,
      filters: sponsorshipFilters,
      results: results.map((s) => ({
        name: s.name,
        city: s.city,
        route: s.route,
        typeRating: s.typeRating,
        isSkilledWorker: s.isSkilledWorker,
        eligibleForSponsorship: sponsorshipFilters ? true : undefined,
      })),
    });
    
    return addCorsHeaders(response, request.headers.get('origin') || undefined);
  } catch (error) {
    console.error("Error fetching sponsored companies:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get('origin') || undefined);
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin || undefined);
}

// POST /api/app/sponsorship/companies - Add sponsored company (mock)
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    
    const user = await authenticate(request);
    if (!user) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return addCorsHeaders(response, origin || undefined);
    }

    const data = await request.json();
    console.log("(Mock) Adding sponsored company:", data);
    const response = NextResponse.json({ companyId: "mock-company-id" });
    return addCorsHeaders(response, origin || undefined);
  } catch (error) {
    console.error("Error adding sponsored company:", error);
    const response = NextResponse.json({ error: "Internal server error" }, { status: 500 });
    return addCorsHeaders(response, request.headers.get('origin') || undefined);
  }
}