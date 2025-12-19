import { withApi, z } from "@/lib/api/withApi";
import { getAdminDb, categorizeFirebaseError } from "@/firebase/admin";
import { ERROR_CODES } from "@/lib/api/errorCodes";

export const runtime = "nodejs";

// Input validation schemas
const searchParamsSchema = z.object({
  q: z.string().max(200).optional(),
  route: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const batchSchema = z.object({
  companies: z.array(z.string().min(1).max(200)).min(1).max(50)
});

// Simple in-memory cache with TTL
const sponsorCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(query: string | null, route: string | null, city: string | null, limit: number, offset: number): string {
  return `sponsors:${query || ''}:${route || ''}:${city || ''}:${limit}:${offset}`;
}

function sanitizeSearchTerm(term: string | null): string | null {
  if (!term) return null;
  return term
    .toLowerCase()
    .trim()
    .replace(/[<>\"'`;\\]/g, '')
    .slice(0, 200);
}

function checkSponsorEligibility(sponsor: any): { isLicensed: boolean; isSkilledWorker: boolean } {
  const typeRating = (sponsor.typeRating || '').toLowerCase();
  const route = (sponsor.route || '').toLowerCase();
  
  const isLicensed = typeRating.includes('a rating') || typeRating.includes('licensed');
  const isSkilledWorker = route.includes('skilled worker');
  
  return { isLicensed, isSkilledWorker };
}

export const GET = withApi({
  auth: 'optional',
  rateLimit: 'sponsor-lookup',
  querySchema: searchParamsSchema,
}, async ({ user, query: params, requestId }) => {
  const query = sanitizeSearchTerm(params.q || null);
  const route = sanitizeSearchTerm(params.route || null);
  const city = sanitizeSearchTerm(params.city || null);
  const { limit, offset } = params;

  // Check cache first
  const cacheKey = getCacheKey(query, route, city, limit, offset);
  const cached = sponsorCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return {
      ...cached.data,
      cached: true,
    };
  }

  const db = getAdminDb();

  // If no search parameters provided, return a basic public response
  if (!query && !route && !city) {
    try {
      const totalSnapshot = await db.collection('sponsors').where('isActive', '==', true).count().get();
      return {
        success: true,
        message: "Sponsors API - use search parameters for detailed results",
        totalActiveSponsors: totalSnapshot.data().count,
        availableRoutes: ['Skilled Worker', 'Global Business Mobility', 'Scale-up', 'Temporary Work'],
        requiresAuth: false,
      };
    } catch (error: any) {
      console.error('Error getting sponsor count:', error);
      return {
        success: true,
        message: "Sponsors API available",
        requiresAuth: false,
      };
    }
  }

  // For search queries, require authentication
  if (!user) {
    return {
      error: 'Authentication required for search',
      code: ERROR_CODES.UNAUTHORIZED,
    };
  }

  let firestoreQuery = db.collection('sponsors').where('isActive', '==', true);

  if (route) {
    const normalizedRoute = route.charAt(0).toUpperCase() + route.slice(1);
    firestoreQuery = firestoreQuery.where('route', '==', normalizedRoute);
  }

  let results: any[] = [];
  let totalMatches = 0;

  if (query || city) {
    const fetchLimit = Math.min(2000, (offset + limit) * 5);
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
    const snapshot = await firestoreQuery.limit(offset + limit + 1).get();
    const allDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    totalMatches = allDocs.length;
    results = allDocs.slice(offset, offset + limit);
  }

  const response = {
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

  return response;
});

export const POST = withApi({
  auth: 'required',
  rateLimit: 'sponsor-batch',
  bodySchema: batchSchema,
}, async ({ body }) => {
  const { companies } = body;
  const db = getAdminDb();
  
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

  return {
    success: true,
    results,
  };
});

export { OPTIONS } from "@/lib/api/withApi";
