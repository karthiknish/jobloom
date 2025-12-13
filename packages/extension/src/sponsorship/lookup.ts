import { sponsorBatchLimiter } from "../rateLimiter";
import { get } from "../apiClient";
import { buildCompanyQueryCandidates, isLikelyPlaceholderCompany, normalizeCompanyName } from "../utils/companyName";

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
}

const sponsorshipCache = new Map<string, SponsorLookupResult | null>();
const sponsorshipInFlight = new Map<string, Promise<SponsorLookupResult | null>>();

function normalizeSponsorRecord(raw: any | null): SponsorLookupResult | null {
  if (!raw) {
    return null;
  }

  const nameValue = typeof raw.name === "string" && raw.name.trim()
    ? raw.name.trim()
    : typeof raw.company === "string" && raw.company.trim()
      ? raw.company.trim()
      : "";

  if (!nameValue) {
    return null;
  }

  const routeValue = typeof raw.route === "string" && raw.route.trim().length
    ? raw.route.trim()
    : typeof raw.sponsorshipType === "string" && raw.sponsorshipType.trim().length
      ? raw.sponsorshipType.trim()
      : undefined;

  const ratingValue = typeof raw.typeRating === "string" && raw.typeRating.trim().length
    ? raw.typeRating.trim()
    : typeof raw.licenseRating === "string" && raw.licenseRating.trim().length
      ? raw.licenseRating.trim()
      : typeof raw.rating === "string" && raw.rating.trim().length
        ? raw.rating.trim()
        : undefined;

  const normalizedRating = ratingValue?.toLowerCase() ?? "";
  const isLicensedSponsor = normalizedRating.includes("a rating") || normalizedRating.includes("licensed");

  const normalizedRoute = routeValue?.toLowerCase() ?? "";
  const isSkilledWorker = normalizedRoute.includes("skilled worker");

  const isActive = raw.isActive !== false;
  const eligible = typeof raw.eligibleForSponsorship === "boolean"
    ? raw.eligibleForSponsorship
    : isActive && (isLicensedSponsor || isSkilledWorker);

  return {
    id: raw.id ?? raw._id ?? raw.docId ?? undefined,
    name: nameValue,
    company: nameValue,
    city: typeof raw.city === "string" ? raw.city : undefined,
    route: routeValue,
    typeRating: ratingValue,
    sponsorshipType: routeValue,
    isActive,
    eligibleForSponsorship: Boolean(eligible),
    isLicensedSponsor: Boolean(isLicensedSponsor),
    isSkilledWorker,
    lastUpdated: raw.lastUpdated ?? raw.updatedAt ?? raw.modifiedAt ?? null,
    source: typeof raw.source === "string" ? raw.source : "official-register",
    raw,
  };
}

async function runWithSponsorLimit<T>(fn: () => Promise<T>): Promise<T> {
  return sponsorBatchLimiter.add(fn);
}

export async function fetchSponsorRecord(company: string): Promise<SponsorLookupResult | null> {
  const normalizedCompany = normalizeCompanyName(company);
  const key = normalizedCompany.toLowerCase();

  if (!key || isLikelyPlaceholderCompany(normalizedCompany)) {
    return null;
  }

  if (sponsorshipCache.has(key)) {
    return sponsorshipCache.get(key) ?? null;
  }

  if (sponsorshipInFlight.has(key)) {
    return sponsorshipInFlight.get(key) ?? null;
  }

  const lookupPromise = runWithSponsorLimit(async () => {
    try {
      const candidates = buildCompanyQueryCandidates(normalizedCompany);
      
      // Pre-check cache for all candidates first
      for (const candidate of candidates) {
        const candidateKey = candidate.toLowerCase();
        if (sponsorshipCache.has(candidateKey)) {
          const cached = sponsorshipCache.get(candidateKey) ?? null;
          sponsorshipCache.set(key, cached);
          return cached;
        }
      }

      // Make parallel API calls for top 2 candidates for better speed
      const candidatesToQuery = candidates.slice(0, 2);
      const responses = await Promise.allSettled(
        candidatesToQuery.map(candidate => 
          get<any>("/api/app/sponsorship/companies", { q: candidate, limit: 5 })
        )
      );

      // Find first successful result
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        if (response.status === 'fulfilled' && response.value) {
          const resultsArray = Array.isArray(response.value?.results)
            ? response.value.results
            : Array.isArray(response.value?.companies)
              ? response.value.companies
              : response.value?.result
                ? [response.value.result]
                : [];

          const normalized = normalizeSponsorRecord(resultsArray[0] ?? null);
          if (normalized) {
            const candidateKey = candidatesToQuery[i].toLowerCase();
            sponsorshipCache.set(candidateKey, normalized);
            sponsorshipCache.set(key, normalized);
            return normalized;
          }
        }
      }

      sponsorshipCache.set(key, null);
      return null;
    } finally {
      sponsorshipInFlight.delete(key);
    }
  });

  sponsorshipInFlight.set(key, lookupPromise);
  return lookupPromise;
}

export function clearSponsorLookupCache(): void {
  sponsorshipCache.clear();
  sponsorshipInFlight.clear();
}
