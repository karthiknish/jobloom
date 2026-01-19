import { 
  normalizeCompanyName,
  isLikelyPlaceholderCompany
} from "@hireall/shared";
import { fetchSponsorRecordFromConvex, saveSponsorshipToConvex, updateSponsorshipInConvex } from "./convexLookup";

interface SponsorLookupResult {
  id?: string;
  name: string;
  company: string;
  eligibleForSponsorship: boolean;
  sponsorshipType?: string;
  isActive: boolean;
  matchConfidence: number;
}

export type { SponsorLookupResult };

export async function fetchSponsorRecord(
  company: string,
  domain?: string
): Promise<SponsorLookupResult | null> {
  const normalizedCompany = normalizeCompanyName(company);
  
  if (!normalizedCompany || isLikelyPlaceholderCompany(normalizedCompany)) {
    return null;
  }

  const domainKey = domain || extractDomain(normalizedCompany);
  
  if (!domainKey) {
    return null;
  }

  try {
    console.log(`[Hireall:Sponsor] Checking Convex for domain "${domainKey}"`);
    
    const result = await fetchSponsorRecordFromConvex(domainKey, normalizedCompany);
    
    if (result) {
      console.log(`[Hireall:Sponsor] Found sponsor in Convex:`, result);
    } else {
      console.log(`[Hireall:Sponsor] No sponsor found for "${domainKey}"`);
    }
    
    return result;
  } catch (error) {
    console.error("[Hireall:Sponsor] Convex lookup failed:", error);
    return null;
  }
}

export async function saveSponsorship(
  domain: string,
  companyName: string,
  isSponsored: boolean,
  sponsorshipType?: string,
  evidence?: string[]
): Promise<string> {
  return await saveSponsorshipToConvex({
    domain: domain.toLowerCase(),
    companyName,
    isSponsored,
    sponsorshipType,
    evidence,
    lastChecked: Date.now(),
    lastUpdated: Date.now(),
  });
}

export async function updateSponsorship(
  id: string,
  updates: {
    isSponsored?: boolean;
    sponsorshipType?: string;
    evidence?: string[];
    notes?: string;
  }
): Promise<void> {
  await updateSponsorshipInConvex(id, updates);
}

function extractDomain(company: string): string | null {
  const urlMatch = company.match(/https?:\/\/(?:www\.)?([a-zA-Z0-9-]+\.)/);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  const domainMatch = company.match(/@([a-zA-Z0-9-]+\.[a-zA-Z0-9-]+)/);
  if (domainMatch) {
    return domainMatch[1];
  }
  
  return null;
}

export async function bulkFetchSponsors(
  companies: Array<{ company: string; domain?: string }>
): Promise<Map<string, SponsorLookupResult>> {
  const results = new Map<string, SponsorLookupResult>();
  
  const promises = companies.map(async ({ company, domain }) => {
    try {
      const result = await fetchSponsorRecord(company, domain);
      if (result && result.id) {
        results.set(result.id, result);
      }
    } catch (error) {
      console.error(`[Hireall:Sponsor] Failed to fetch sponsor for "${company}":`, error);
    }
  });
  
  await Promise.all(promises);
  
  return results;
}
