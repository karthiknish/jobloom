import { post } from "../apiClient";
import { isLikelyPlaceholderCompany, normalizeCompanyName } from "../utils/companyName";
import { sponsorshipCache } from "./cache";

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

export interface SponsorLookupOptions {
  city?: string;
  location?: string;
}

/**
 * Fetch sponsor record from API with caching and deduplication.
 * Uses shared sponsorshipCache to prevent duplicate lookups across components.
 */
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
  const cacheKey = `lookup:${options?.city || options?.location 
    ? `${key}:${(options.city || options.location || '').toLowerCase()}`
    : key}`;

  // Use shared cache with automatic deduplication
  return sponsorshipCache.getOrFetch<SponsorLookupResult | null>(
    cacheKey,
    async () => {
      const startTime = Date.now();
      try {
        console.log(`[Hireall:Sponsor] Starting API call for "${company}"`);
        
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
        console.log(`[Hireall:Sponsor] API responded in ${elapsed}ms for "${company}"`, {
          found: checkResponse.found,
          confidence: checkResponse.matchDetails?.confidence,
        });

        if (checkResponse.found && checkResponse.sponsor) {
          const result = mapCheckResponseToResult(checkResponse);
          
          if (result) {
            console.debug("Hireall: Sponsor found:", {
              name: result.name,
              confidence: result.matchConfidence,
              nameMatch: result.nameMatch,
              locationMatch: result.locationMatch,
            });
            
            // Also cache without location for broader matches
            const baseKey = `lookup:${key}`;
            if (cacheKey !== baseKey) {
              sponsorshipCache.set(baseKey, result);
            }
            
            return result;
          }
        }

        console.debug("Hireall: No sponsor match found for:", company);
        return null;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn("Hireall: Sponsor check failed:", errorMsg);
        // Return null (will be cached to avoid repeated failures)
        return null;
      }
    }
  );
}

export function clearSponsorLookupCache(): void {
  sponsorshipCache.clear();
}
