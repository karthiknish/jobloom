import { NextRequest, NextResponse } from "next/server";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

import { getAdminDb } from "@/firebase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { withErrorHandling, generateRequestId } from "@/lib/api/errors";

interface SponsorCheckRequest {
  company: string;
  city?: string;
  location?: string;
}

interface SponsorCheckResult {
  found: boolean;
  isSponsored: boolean;
  sponsor?: {
    id: string;
    name: string;
    city?: string;
    route?: string;
    typeRating?: string;
    isSkilledWorker: boolean;
    isLicensedSponsor: boolean;
  };
  matchDetails: {
    nameMatch: 'exact' | 'partial' | 'fuzzy' | 'none';
    locationMatch: 'exact' | 'partial' | 'none' | 'not_provided';
    confidence: number;
  };
}

// Normalize company name for matching
function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove common suffixes
    .replace(/\s+(ltd|limited|plc|llc|inc|corp|corporation|group|uk|international)\.?$/gi, '')
    .replace(/\s+(private|pvt)\.?\s*(ltd|limited)?\.?$/gi, '')
    // Remove special characters
    .replace(/[^\w\s]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate similarity between two strings (0-1)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // Levenshtein-based similarity
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(s1, s2);
  return 1 - (distance / maxLen);
}

function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

// Map Firestore doc to sponsor result
function mapDocToSponsor(doc: QueryDocumentSnapshot<Record<string, any>>): SponsorCheckResult['sponsor'] {
  const data = doc.data();
  const route = typeof data.route === "string" ? data.route : data.sponsorshipType ?? "";
  const typeRating = typeof data.typeRating === "string"
    ? data.typeRating
    : typeof data.licenseRating === "string"
      ? data.licenseRating
      : "";

  const normalizedRating = typeRating.toLowerCase();
  const isLicensedSponsor = normalizedRating.includes("a rating") || normalizedRating.includes("licensed");
  const isSkilledWorker = route.toLowerCase().includes("skilled worker");

  return {
    id: doc.id,
    name: (data.name || data.company || "").trim(),
    city: data.city,
    route: route || undefined,
    typeRating: typeRating || undefined,
    isSkilledWorker,
    isLicensedSponsor,
  };
}

// POST /api/app/sponsorship/check - Check if a specific company is a sponsor
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  return withErrorHandling(async () => {
    // Authenticate the request
    const auth = await authenticateRequest(request, { loadUser: false });

    if (!auth.ok) {
      return auth.response;
    }

    console.log(`[POST /api/app/sponsorship/check] Request ${requestId} - authenticated: true`);

    const body: SponsorCheckRequest = await request.json();
    
    if (!body.company || typeof body.company !== 'string') {
      return NextResponse.json({
        error: "Company name is required",
        code: "MISSING_COMPANY"
      }, { status: 400 });
    }

    const companyName = body.company.trim();
    const normalizedSearch = normalizeCompanyName(companyName);
    const searchLocation = (body.city || body.location || '').toLowerCase().trim();

    console.log('[POST /api/app/sponsorship/check] Checking:', {
      requestId,
      company: companyName,
      normalized: normalizedSearch,
      location: searchLocation || '(none)'
    });

    const db = getAdminDb();
    const sponsorsRef = db.collection("sponsors");

    // Strategy 1: Try exact name match (case-insensitive via nameLower)
    let bestMatch: { doc: QueryDocumentSnapshot<Record<string, any>>; score: number; nameMatch: string; locationMatch: string } | null = null;

    try {
      // Query with prefix matching on searchName field (matching Firestore schema)
      const searchLower = normalizedSearch.toLowerCase();
      const searchUpper = searchLower + '\uf8ff';
      
      // Use searchName field for case-insensitive prefix search
      const prefixQuery = sponsorsRef
        .where("searchName", ">=", searchLower)
        .where("searchName", "<=", searchUpper)
        .limit(50);
      
      const snapshot = await prefixQuery.get();
      
      console.log(`[POST /api/app/sponsorship/check] Found ${snapshot.size} potential matches for "${searchLower}"`);


      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sponsorName = (data.name || data.company || '').trim();
        const normalizedSponsor = normalizeCompanyName(sponsorName);
        const sponsorCity = (data.city || '').toLowerCase().trim();

        // Calculate name similarity
        const nameSimilarity = calculateSimilarity(normalizedSearch, normalizedSponsor);
        
        // Determine name match type
        let nameMatch = 'none';
        if (normalizedSearch === normalizedSponsor) {
          nameMatch = 'exact';
        } else if (nameSimilarity >= 0.85) {
          nameMatch = 'partial';
        } else if (nameSimilarity >= 0.7) {
          nameMatch = 'fuzzy';
        }

        if (nameMatch === 'none') continue;

        // Calculate location match
        let locationMatch = 'not_provided';
        let locationScore = 0;
        if (searchLocation) {
          if (sponsorCity === searchLocation) {
            locationMatch = 'exact';
            locationScore = 1;
          } else if (sponsorCity.includes(searchLocation) || searchLocation.includes(sponsorCity)) {
            locationMatch = 'partial';
            locationScore = 0.7;
          } else {
            locationMatch = 'none';
            locationScore = 0;
          }
        } else {
          locationScore = 0.5; // Neutral if not provided
        }

        // Calculate overall score
        const overallScore = (nameSimilarity * 0.7) + (locationScore * 0.3);

        if (!bestMatch || overallScore > bestMatch.score) {
          bestMatch = { doc, score: overallScore, nameMatch, locationMatch };
        }

        // If we found an exact match with location, stop searching
        if (nameMatch === 'exact' && locationMatch === 'exact') {
          break;
        }
      }
    } catch (error) {
      console.error('[POST /api/app/sponsorship/check] Query error:', error);
    }

    const processingTime = Date.now() - startTime;

    if (bestMatch && bestMatch.score >= 0.7) {
      const sponsor = mapDocToSponsor(bestMatch.doc);
      
      if (!sponsor) {
        // Should not happen but handle gracefully
        return NextResponse.json({
          found: false,
          isSponsored: false,
          matchDetails: { nameMatch: 'none', locationMatch: 'not_provided', confidence: 0 },
          processingTime
        });
      }
      
      const isSponsored = sponsor.isLicensedSponsor || sponsor.isSkilledWorker;

      console.log('[POST /api/app/sponsorship/check] Found match:', {
        requestId,
        sponsor: sponsor.name,
        nameMatch: bestMatch.nameMatch,
        locationMatch: bestMatch.locationMatch,
        confidence: Math.round(bestMatch.score * 100),
        processingTime
      });

      return NextResponse.json({
        found: true,
        isSponsored,
        sponsor,
        matchDetails: {
          nameMatch: bestMatch.nameMatch as any,
          locationMatch: bestMatch.locationMatch as any,
          confidence: bestMatch.score,
        },
        processingTime
      });
    }

    console.log('[POST /api/app/sponsorship/check] No match found:', {
      requestId,
      company: companyName,
      processingTime
    });

    return NextResponse.json({
      found: false,
      isSponsored: false,
      matchDetails: {
        nameMatch: 'none',
        locationMatch: 'not_provided',
        confidence: 0,
      },
      processingTime
    });

  }, {
    endpoint: '/api/app/sponsorship/check',
    method: 'POST',
    requestId,
  });
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
