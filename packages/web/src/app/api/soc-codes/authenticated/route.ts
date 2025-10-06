import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from "@/lib/auth/session";

// CORS helper function
function addCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigins = [
    'https://www.linkedin.com',
    'https://linkedin.com',
    process.env.NEXT_PUBLIC_WEB_URL || 'https://hireall.app',
    'http://localhost:3000',
  ];

  const requestOrigin = origin;

  if (requestOrigin && (allowedOrigins.includes(requestOrigin) || 
      requestOrigin.includes('hireall.app') || 
      requestOrigin.includes('vercel.app') || 
      requestOrigin.includes('netlify.app'))) {
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

// Protected endpoint for SOC codes - authentication required
export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');

    // Verify session
    const decodedToken = await verifySessionFromRequest(request);
    if (!decodedToken) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return addCorsHeaders(response, origin || undefined);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase().trim();
    const code = searchParams.get('code')?.trim();
    const eligibility = searchParams.get('eligibility')?.toLowerCase().trim();
    const limit = parseInt(searchParams.get('limit') || '20');

    // Mock SOC codes data for authenticated access
    const mockSocCodes = [
      {
        id: "1111",
        code: "1111",
        jobType: "Chief executives and senior officials",
        relatedTitles: [
          "Chairpersons",
          "Chief executives",
          "Diplomats and foreign office officials",
          "Senior public service officials"
        ],
        eligibility: "Higher Skilled",
        isEligible: true
      },
      {
        id: "1112",
        code: "1112",
        jobType: "Elected officers and representatives",
        relatedTitles: [
          "Assembly members and Members of Parliament",
          "Councillors"
        ],
        eligibility: "Ineligible",
        isEligible: false
      },
      {
        id: "1121",
        code: "1121",
        jobType: "Production managers and directors in manufacturing",
        relatedTitles: [
          "Production managers and directors in manufacturing"
        ],
        eligibility: "Higher Skilled",
        isEligible: true
      },
      {
        id: "1131",
        code: "1131",
        jobType: "Financial managers and directors",
        relatedTitles: [
          "Bank, building society and post office managers",
          "Company secretaries and finance managers and directors"
        ],
        eligibility: "Higher Skilled",
        isEligible: true
      },
      {
        id: "1136",
        code: "1136",
        jobType: "Human resource managers and directors",
        relatedTitles: [
          "Employee relations managers",
          "Equality, diversity and inclusion managers",
          "Learning and development managers"
        ],
        eligibility: "Higher Skilled",
        isEligible: true
      },
      {
        id: "2111",
        code: "2111",
        jobType: "Chemical scientists",
        relatedTitles: [
          "Analytical chemists",
          "Industrial chemists",
          "Organic chemists"
        ],
        eligibility: "Higher Skilled",
        isEligible: true
      },
      {
        id: "2112",
        code: "2112",
        jobType: "Biological scientists and biochemists",
        relatedTitles: [
          "Biochemists",
          "Biologists",
          "Microbiologists"
        ],
        eligibility: "Higher Skilled",
        isEligible: true
      },
      {
        id: "2121",
        code: "2121",
        jobType: "Civil engineers",
        relatedTitles: [
          "Civil engineers"
        ],
        eligibility: "Higher Skilled",
        isEligible: true
      },
      {
        id: "2122",
        code: "2122",
        jobType: "Mechanical engineers",
        relatedTitles: [
          "Aeronautical engineers",
          "Automotive engineers",
          "Mechanical engineers"
        ],
        eligibility: "Higher Skilled",
        isEligible: true
      },
      {
        id: "2133",
        code: "2133",
        jobType: "IT specialist managers",
        relatedTitles: [
          "IT project managers",
          "IT security managers"
        ],
        eligibility: "Higher Skilled",
        isEligible: true
      }
    ];

    let results = mockSocCodes;

    // Apply filters
    if (eligibility) {
      results = results.filter(item =>
        item.eligibility.toLowerCase().includes(eligibility)
      );
    }

    if (code) {
      results = results.filter(item => item.code === code);
    }

    if (query) {
      results = results.filter(item =>
        item.jobType?.toLowerCase().includes(query) ||
        item.relatedTitles?.some(title =>
          title.toLowerCase().includes(query)
        )
      );
    }

    // Apply limit
    results = results.slice(0, limit);

    const response = NextResponse.json({
      success: true,
      query,
      code,
      eligibility,
      totalResults: results.length,
      results: results.map(item => ({
        id: item.id,
        code: item.code,
        jobType: item.jobType,
        relatedTitles: item.relatedTitles || [],
        eligibility: item.eligibility,
        isEligible: item.isEligible
      }))
    });

    return addCorsHeaders(response, request.headers.get('origin') || undefined);

  } catch (error) {
    console.error('Error searching SOC codes:', error);
    const response = NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
    return addCorsHeaders(response, request.headers.get('origin') || undefined);
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin || undefined);
}
