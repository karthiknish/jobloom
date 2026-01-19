import { executeConvexQuery, executeConvexMutation } from "../convex";

interface SponsorshipData {
  domain: string;
  companyName: string;
  isSponsored: boolean;
  evidence?: string[];
  sponsorshipType?: string;
  notes?: string;
  lastChecked: number;
  lastUpdated: number;
}

interface SponsorLookupResult {
  id?: string;
  name: string;
  company: string;
  eligibleForSponsorship: boolean;
  sponsorshipType?: string;
  isActive: boolean;
  matchConfidence: number;
}

export async function fetchSponsorRecordFromConvex(
  domain: string,
  companyName: string
): Promise<SponsorLookupResult | null> {
  try {
    const sponsorships = await executeConvexQuery("sponsorships:getSponsorshipByDomain", {
      domain: domain.toLowerCase(),
    });

    if (!sponsorships) {
      return null;
    }

    return {
      id: sponsorships._id,
      name: sponsorships.companyName,
      company: sponsorships.companyName,
      eligibleForSponsorship: sponsorships.isSponsored,
      sponsorshipType: sponsorships.sponsorshipType,
      isActive: true,
      matchConfidence: 100,
    };
  } catch (error) {
    console.error("[Convex Lookup] Error fetching sponsorship:", error);
    return null;
  }
}

export async function saveSponsorshipToConvex(
  data: SponsorshipData
): Promise<string> {
  const id = await executeConvexMutation("sponsorships:createSponsorship", data);
  console.log("[Convex Lookup] Saved sponsor:", id);
  return id;
}

export async function updateSponsorshipInConvex(
  id: string,
  updates: Partial<Omit<SponsorshipData, "domain" | "companyName" | "lastChecked" | "lastUpdated">>
): Promise<void> {
  await executeConvexMutation("sponsorships:updateSponsorship", {
    id,
    updates,
  });
}
