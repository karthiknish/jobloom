import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, categorizeFirebaseError } from '@/firebase/admin';
import { authenticateRequest } from '@/lib/api/auth';
import { z } from 'zod';

// Input validation schemas
const searchParamsSchema = z.object({
  q: z.string().max(200).optional(),
  route: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Response types
interface SponsorResult {
  id: string;
  name: string;
  city: string | null;
  county: string | null;
  typeRating: string | null;
  route: string | null;
  isSkilledWorker: boolean;
  isLicensed: boolean;
}

interface SponsorApiResponse {
  success: boolean;
  query?: string;
  route?: string;
  city?: string;
  totalResults: number;
  hasMore: boolean;
  results: SponsorResult[];
  cached?: boolean;
  requestId?: string;
}

// Simple in-memory cache with TTL
const sponsorCache = new Map<string, { data: SponsorApiResponse; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Rate limiting (in-memory, per-IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute for public endpoint

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return `sponsor-api:${ip}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = rateLimitMap.get(key);
  
  if (!existing || existing.resetAt < now) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt };
  }
  
  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }
  
  existing.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - existing.count, resetAt: existing.resetAt };
}

function getCacheKey(query: string | null, route: string | null, city: string | null, limit: number, offset: number): string {
  return `sponsors:${query || ''}:${route || ''}:${city || ''}:${limit}:${offset}`;
}

function sanitizeSearchTerm(term: string | null): string | null {
  if (!term) return null;
  // Remove potentially dangerous characters and normalize
  return term
    .toLowerCase()
    .trim()
    .replace(/[<>\"'`;\\]/g, '')
    .slice(0, 200);
}

/**
 * Check if a sponsor is eligible for skilled worker sponsorship
 */
function checkSponsorEligibility(sponsor: any): { isLicensed: boolean; isSkilledWorker: boolean } {
  const typeRating = (sponsor.typeRating || '').toLowerCase();
  const route = (sponsor.route || '').toLowerCase();
  
  const isLicensed = typeRating.includes('a rating') || typeRating.includes('licensed');
  const isSkilledWorker = route.includes('skilled worker');
  
  return { isLicensed, isSkilledWorker };
}

export async function GET(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();
  
  try {
    // Rate limiting check
    const rateLimitKey = getRateLimitKey(request);
    const rateLimit = checkRateLimit(rateLimitKey);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        requestId
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString()
        }
      });
    }

    // Parse and validate input
    const { searchParams } = new URL(request.url);
    const rawParams = {
      q: searchParams.get('q'),
      route: searchParams.get('route'),
      city: searchParams.get('city'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    };
    
    const parseResult = searchParamsSchema.safeParse(rawParams);
    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: parseResult.error.flatten().fieldErrors,
        requestId
      }, { status: 400 });
    }
    
    const params = parseResult.data;
    const query = sanitizeSearchTerm(params.q || null);
    const route = sanitizeSearchTerm(params.route || null);
    const city = sanitizeSearchTerm(params.city || null);
    const { limit, offset } = params;

    // Check cache first
    const cacheKey = getCacheKey(query, route, city, limit, offset);
    const cached = sponsorCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
        requestId
      }, {
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-Cache': 'HIT',
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      });
    }

    // If no search parameters provided, return a basic public response
    if (!query && !route && !city) {
      try {
        const db = getAdminDb();
        const totalSnapshot = await db.collection('sponsors').where('isActive', '==', true).count().get();
        return NextResponse.json({
          success: true,
          message: "Sponsors API - use search parameters for detailed results",
          totalActiveSponsors: totalSnapshot.data().count,
          availableRoutes: ['Skilled Worker', 'Global Business Mobility', 'Scale-up', 'Temporary Work'],
          requiresAuth: false,
          requestId
        }, {
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString()
          }
        });
      } catch (error: any) {
        const categorized = categorizeFirebaseError(error);
        console.error('Error getting sponsor count:', { error: categorized, requestId });
        return NextResponse.json({
          success: true,
          message: "Sponsors API available",
          requiresAuth: false,
          requestId
        });
      }
    }

    // For search queries, require authentication
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return auth.response;
    }

    const db = getAdminDb();
    let firestoreQuery = db.collection('sponsors').where('isActive', '==', true);

    // Apply route filter (Firestore native)
    if (route) {
      const normalizedRoute = route.charAt(0).toUpperCase() + route.slice(1);
      firestoreQuery = firestoreQuery.where('route', '==', normalizedRoute);
    }

    // For text search, we use client-side filtering with pagination
    // In production, consider Algolia, Typesense, or Firestore full-text search extensions
    let results: any[] = [];
    let totalMatches = 0;

    if (query || city) {
      // Get documents with a reasonable limit for filtering
      const fetchLimit = Math.min(2000, (offset + limit) * 5); // Fetch more than needed for filtering
      const snapshot = await firestoreQuery.limit(fetchLimit).get();

      const allMatches = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((sponsor: any) => {
          const nameMatch = query ? sponsor.searchName?.includes(query) : true;
          const cityMatch = city ? sponsor.searchCity?.includes(city) : true;
          return nameMatch && cityMatch;
        });
      
      totalMatches = allMatches.length;
      results = allMatches.slice(offset, offset + limit);
    } else {
      // Simple query with offset simulation (Firestore doesn't support offset natively)
      const snapshot = await firestoreQuery.limit(offset + limit + 1).get();
      const allDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      totalMatches = allDocs.length;
      results = allDocs.slice(offset, offset + limit);
    }

    const response: SponsorApiResponse = {
      success: true,
      query: query || undefined,
      route: route || undefined,
      city: city || undefined,
      totalResults: results.length,
      hasMore: totalMatches > offset + limit,
      results: results.map((sponsor: any) => {
        const eligibility = checkSponsorEligibility(sponsor);
        return {
          id: sponsor.id,
          name: sponsor.name || 'Unknown',
          city: sponsor.city || null,
          county: sponsor.county || null,
          typeRating: sponsor.typeRating || null,
          route: sponsor.route || null,
          isSkilledWorker: eligibility.isSkilledWorker,
          isLicensed: eligibility.isLicensed
        };
      }),
      requestId
    };

    // Cache the response
    sponsorCache.set(cacheKey, { data: response, timestamp: Date.now() });
    
    // Clean old cache entries periodically
    if (sponsorCache.size > 500) {
      const now = Date.now();
      for (const [key, value] of sponsorCache.entries()) {
        if (now - value.timestamp > CACHE_TTL_MS) {
          sponsorCache.delete(key);
        }
      }
    }

    return NextResponse.json(response, {
      headers: {
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-Cache': 'MISS',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });

  } catch (error: any) {
    const categorized = categorizeFirebaseError(error);
    console.error('Error searching sponsors:', { error: categorized, requestId });
    
    // Return appropriate status based on error category
    const status = categorized.category === 'network' ? 503 : 
                   categorized.category === 'permission' ? 403 : 500;
    
    return NextResponse.json({
      success: false,
      error: categorized.retryable ? 'Service temporarily unavailable' : 'Internal server error',
      code: categorized.code,
      retryable: categorized.retryable,
      requestId
    }, { status });
  }
}

// POST endpoint for batch sponsor lookups
export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  try {
    // Require authentication for batch lookups
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return auth.response;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON body',
        requestId
      }, { status: 400 });
    }

    // Validate batch request
    const batchSchema = z.object({
      companies: z.array(z.string().min(1).max(200)).min(1).max(50)
    });
    
    const parseResult = batchSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body',
        details: parseResult.error.flatten(),
        requestId
      }, { status: 400 });
    }

    const { companies } = parseResult.data;
    const db = getAdminDb();
    
    // Batch lookup - search for each company
    const results = await Promise.all(
      companies.map(async (companyName) => {
        const searchName = companyName.toLowerCase().trim();
        try {
          const snapshot = await db.collection('sponsors')
            .where('isActive', '==', true)
            .where('searchName', '>=', searchName)
            .where('searchName', '<=', searchName + '\uf8ff')
            .limit(5)
            .get();
          
          if (snapshot.empty) {
            return { company: companyName, found: false, sponsors: [] };
          }
          
          const sponsors = snapshot.docs.map((doc) => {
            const data = doc.data();
            const eligibility = checkSponsorEligibility(data);
            return {
              id: doc.id,
              name: data.name,
              route: data.route,
              typeRating: data.typeRating,
              ...eligibility
            };
          });
          
          return { company: companyName, found: true, sponsors };
        } catch (error) {
          console.error(`Error looking up company ${companyName}:`, error);
          return { company: companyName, found: false, error: true, sponsors: [] };
        }
      })
    );

    return NextResponse.json({
      success: true,
      results,
      requestId
    });

  } catch (error: any) {
    const categorized = categorizeFirebaseError(error);
    console.error('Batch sponsor lookup error:', { error: categorized, requestId });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process batch lookup',
      requestId
    }, { status: 500 });
  }
}
