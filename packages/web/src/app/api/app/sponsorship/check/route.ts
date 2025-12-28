import { NextResponse } from "next/server";
import { z } from "zod";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { withApi, OPTIONS } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { stripLegalSuffixes as normalizeCompanyName } from "@hireall/shared";

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const sponsorCheckSchema = z.object({
  company: z.string().min(1, "Company name is required").max(500),
  city: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================



function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
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

function mapDocToSponsor(doc: QueryDocumentSnapshot<Record<string, any>>) {
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

// ============================================================================
// API HANDLER
// ============================================================================

export const POST = withApi({
  auth: 'required',
  rateLimit: 'sponsor-lookup',
  bodySchema: sponsorCheckSchema,
}, async ({ body, requestId }) => {
  const startTime = Date.now();
  
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

  let bestMatch: { 
    doc: QueryDocumentSnapshot<Record<string, any>>; 
    score: number; 
    nameMatch: string; 
    locationMatch: string;
  } | null = null;

  try {
    const searchLower = normalizedSearch.toLowerCase();
    const searchUpper = searchLower + '\uf8ff';
    
    const prefixQuery = sponsorsRef
      .where("searchName", ">=", searchLower)
      .where("searchName", "<=", searchUpper)
      .limit(50);
    
    const snapshot = await prefixQuery.get();
    
    console.log(`[POST /api/app/sponsorship/check] Found ${snapshot.size} potential matches`);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const sponsorName = (data.name || data.company || '').trim();
      const normalizedSponsor = normalizeCompanyName(sponsorName);
      const sponsorCity = (data.city || '').toLowerCase().trim();

      const nameSimilarity = calculateSimilarity(normalizedSearch, normalizedSponsor);
      
      let nameMatch = 'none';
      if (normalizedSearch === normalizedSponsor) {
        nameMatch = 'exact';
      } else if (nameSimilarity >= 0.85) {
        nameMatch = 'partial';
      } else if (nameSimilarity >= 0.7) {
        nameMatch = 'fuzzy';
      }

      if (nameMatch === 'none') continue;

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
        locationScore = 0.5;
      }

      const overallScore = (nameSimilarity * 0.7) + (locationScore * 0.3);

      if (!bestMatch || overallScore > bestMatch.score) {
        bestMatch = { doc, score: overallScore, nameMatch, locationMatch };
      }

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
    const isSponsored = sponsor.isLicensedSponsor || sponsor.isSkilledWorker;

    console.log('[POST /api/app/sponsorship/check] Found match:', {
      requestId,
      sponsor: sponsor.name,
      nameMatch: bestMatch.nameMatch,
      locationMatch: bestMatch.locationMatch,
      confidence: Math.round(bestMatch.score * 100),
      processingTime
    });

    return {
      found: true,
      isSponsored,
      sponsor,
      matchDetails: {
        nameMatch: bestMatch.nameMatch,
        locationMatch: bestMatch.locationMatch,
        confidence: bestMatch.score,
      },
      processingTime,
    };
  }

  console.log('[POST /api/app/sponsorship/check] No match found:', {
    requestId,
    company: companyName,
    processingTime
  });

  return {
    found: false,
    isSponsored: false,
    matchDetails: {
      nameMatch: 'none',
      locationMatch: 'not_provided',
      confidence: 0,
    },
    processingTime,
  };
});
