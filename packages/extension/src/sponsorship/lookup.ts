import { sponsorBatchLimiter } from "../rateLimiter";
import { get, post } from "../apiClient";
import { isLikelyPlaceholderCompany, normalizeCompanyName } from "../utils/companyName";

export interface SponsorLookupResult {
  id?: string;
  name: string;
  company: string;
  city?: string;
  route?: string;
  typeRating?: string;
  sponsorshipType?: string;
  isActive: boolean;
  eligibleForSponsorship: boolean;
  isLicensedSponsor: boolean;
  isSkilledWorker: boolean;
  lastUpdated?: string | number | null;
  source?: string;
  raw?: any;
  // New fields from check endpoint
  matchConfidence?: number;
  nameMatch?: 'exact' | 'partial' | 'fuzzy' | 'none';
  locationMatch?: 'exact' | 'partial' | 'none' | 'not_provided';
}

interface SponsorCheckResponse {
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
  processingTime?: number;
}

const sponsorshipCache = new Map<string, SponsorLookupResult | null>();
const sponsorshipInFlight = new Map<string, Promise<SponsorLookupResult | null>>();

function mapCheckResponseToResult(response: SponsorCheckResponse): SponsorLookupResult | null {
  if (!response.found || !response.sponsor) {
    return null;
  }

  const sponsor = response.sponsor;
  return {
    id: sponsor.id,
    name: sponsor.name,
    company: sponsor.name,
    city: sponsor.city,
    route: sponsor.route,
    typeRating: sponsor.typeRating,
    sponsorshipType: sponsor.route,
    isActive: true,
    eligibleForSponsorship: response.isSponsored,
    isLicensedSponsor: sponsor.isLicensedSponsor,
    isSkilledWorker: sponsor.isSkilledWorker,
    source: "official-register",
    matchConfidence: response.matchDetails.confidence,
    nameMatch: response.matchDetails.nameMatch,
    locationMatch: response.matchDetails.locationMatch,
  };
}

async function runWithSponsorLimit<T>(fn: () => Promise<T>): Promise<T> {
  return sponsorBatchLimiter.add(fn);
}

export interface SponsorLookupOptions {
  city?: string;
  location?: string;
}

export async function fetchSponsorRecord(
  company: string,
  options?: SponsorLookupOptions
): Promise<SponsorLookupResult | null> {
  const normalizedCompany = normalizeCompanyName(company);
  const key = normalizedCompany.toLowerCase();

  if (!key || isLikelyPlaceholderCompany(normalizedCompany)) {
    return null;
  }

  // Include location in cache key if provided
  const cacheKey = options?.city || options?.location 
    ? `${key}:${(options.city || options.location || '').toLowerCase()}`
    : key;

  if (sponsorshipCache.has(cacheKey)) {
    console.debug("Hireall: Using cached sponsor result for", company);
    return sponsorshipCache.get(cacheKey) ?? null;
  }

  if (sponsorshipInFlight.has(cacheKey)) {
    return sponsorshipInFlight.get(cacheKey) ?? null;
  }

  const lookupPromise = runWithSponsorLimit(async () => {
    const startTime = Date.now();
    try {
      console.debug(`[Hireall:Sponsor] Starting lookup for "${company}" at ${new Date().toISOString()}`);
      
      // Use the new dedicated check endpoint - requires authentication
      const checkResponse = await post<SponsorCheckResponse>("/api/app/sponsorship/check", {
        company: normalizedCompany,
        city: options?.city,
        location: options?.location,
      }, true, {  // true = require auth
        timeout: 10000, // 10 second timeout
        retryCount: 0,  // No retries for faster response
      });
      
      const elapsed = Date.now() - startTime;
      console.debug(`[Hireall:Sponsor] API responded in ${elapsed}ms for "${company}"`);


      if (checkResponse.found && checkResponse.sponsor) {
        const result = mapCheckResponseToResult(checkResponse);
        
        if (result) {
          console.debug("Hireall: Sponsor found:", {
            name: result.name,
            confidence: result.matchConfidence,
            nameMatch: result.nameMatch,
            locationMatch: result.locationMatch,
          });
          
          sponsorshipCache.set(cacheKey, result);
          sponsorshipCache.set(key, result); // Also cache without location
          return result;
        }
      }

      console.debug("Hireall: No sponsor match found for:", company);
      sponsorshipCache.set(cacheKey, null);
      return null;

    } catch (error) {
      console.warn("Hireall: Sponsor check failed:", error);
      // Cache null to avoid repeated failures
      sponsorshipCache.set(cacheKey, null);
      return null;
    } finally {
      sponsorshipInFlight.delete(cacheKey);
    }
  });

  sponsorshipInFlight.set(cacheKey, lookupPromise);
  return lookupPromise;
}

export function clearSponsorLookupCache(): void {
  sponsorshipCache.clear();
  sponsorshipInFlight.clear();
}

