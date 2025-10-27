import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { withErrorHandling, generateRequestId } from "@/lib/api/errors";

// GET /api/app/sponsorship/companies - Get sponsored companies (admin only)
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    const auth = await authenticateRequest(request, {
      requireAdmin: true,
      loadUser: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limitNum = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search')?.trim();
    const industry = searchParams.get('industry')?.trim();
    const sponsorshipType = searchParams.get('sponsorshipType')?.trim();
    const status = searchParams.get('status')?.trim() as 'active' | 'inactive' | 'all' | undefined;

    const db = getAdminDb();
    let sponsorsQuery = db.collection("sponsors");
    
    // Apply filters
    if (industry && industry !== 'all') {
      sponsorsQuery = sponsorsQuery.where('industry', '==', industry) as any;
    }
    
    if (sponsorshipType && sponsorshipType !== 'all') {
      sponsorsQuery = sponsorsQuery.where('sponsorshipType', '==', sponsorshipType) as any;
    }
    
    if (status === 'active') {
      sponsorsQuery = sponsorsQuery.where('isActive', '==', true) as any;
    } else if (status === 'inactive') {
      sponsorsQuery = sponsorsQuery.where('isActive', '==', false) as any;
    }
    
    // Add ordering
    sponsorsQuery = sponsorsQuery.orderBy('createdAt', 'desc') as any;
    
    // Get total count by fetching all documents (less efficient but works)
    const countSnapshot = await sponsorsQuery.get();
    const total = countSnapshot.size;
    
    // Add pagination
    sponsorsQuery = sponsorsQuery.limit(limitNum) as any;
    
    if (page > 1) {
      sponsorsQuery = sponsorsQuery.offset((page - 1) * limitNum) as any;
    }
    
    const snapshot = await sponsorsQuery.get();
    
    let companies = snapshot.docs.map((doc: any) => ({
      _id: doc.id,
      ...doc.data()
    }));
    
    // Apply search filter client-side if needed
    if (search && search.trim()) {
      companies = companies.filter((company: any) => 
        company.name?.toLowerCase().includes(search.toLowerCase()) ||
        company.description?.toLowerCase().includes(search.toLowerCase()) ||
        company.industry?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const hasMore = page * limitNum < total;

    return NextResponse.json({
      companies,
      total,
      page,
      limit: limitNum,
      hasMore,
      message: 'Sponsored companies retrieved successfully'
    });
  }, {
    endpoint: '/api/app/sponsorship/companies',
    method: 'GET',
    requestId
  });
}

// POST /api/app/sponsorship/companies - Create new sponsored company
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    const auth = await authenticateRequest(request, {
      requireAdmin: true,
      loadUser: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const companyData = await request.json();
    
    const db = getAdminDb();
    const docRef = await db.collection("sponsors").add({
      ...companyData,
      isActive: companyData.isActive ?? true,
      createdAt: Date.now(),
      createdBy: auth.token.uid
    });
    
    return NextResponse.json({
      _id: docRef.id,
      message: 'Sponsored company created successfully'
    });
  }, {
    endpoint: '/api/app/sponsorship/companies',
    method: 'POST',
    requestId
  });
}