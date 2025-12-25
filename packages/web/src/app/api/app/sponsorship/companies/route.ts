import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { QueryDocumentSnapshot, Query } from "firebase-admin/firestore";

import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";

// Zod schema for GET query parameters
const sponsorshipCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  q: z.string().max(200).optional(),
  search: z.string().max(200).optional(),
  status: z.enum(["active", "inactive", "all"]).optional(),
});

interface SponsorRecord {
  id: string;
  _id: string;
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
  industry?: string;
  description?: string;
  website?: string;
  createdAt?: string | number | null;
  notes?: string;
  raw?: Record<string, any>;
}

function mapToPublicSponsor(doc: QueryDocumentSnapshot<Record<string, any>>): SponsorRecord {
  const data = doc.data();
  const route = typeof data.route === "string" ? data.route : data.sponsorshipType ?? "";
  const typeRating = typeof data.typeRating === "string"
    ? data.typeRating
    : typeof data.licenseRating === "string"
      ? data.licenseRating
      : typeof data.rating === "string"
        ? data.rating
        : "";

  const normalizedRating = typeRating.toLowerCase();
  const isLicensedSponsor = normalizedRating.includes("a rating") || normalizedRating.includes("licensed");
  const normalizedRoute = typeof route === "string" ? route.toLowerCase() : "";
  const isSkilledWorker = normalizedRoute.includes("skilled worker");
  const isActive = data.isActive !== false;
  const eligible = typeof data.eligibleForSponsorship === "boolean"
    ? data.eligibleForSponsorship
    : isActive && (isLicensedSponsor || isSkilledWorker);

  return {
    id: doc.id,
    _id: doc.id,
    name: (data.name || data.company || "").trim(),
    company: (data.name || data.company || "").trim(),
    city: data.city,
    route: typeof data.route === "string" ? data.route : undefined,
    typeRating: typeRating || undefined,
    sponsorshipType: route || undefined,
    isActive,
    eligibleForSponsorship: eligible,
    isLicensedSponsor,
    isSkilledWorker,
    lastUpdated: data.updatedAt ?? data.lastUpdated ?? data.modifiedAt ?? null,
    source: data.source || "official-register",
    industry: typeof data.industry === "string" ? data.industry : undefined,
    description: typeof data.description === "string" ? data.description : undefined,
    website: typeof data.website === "string" ? data.website : undefined,
    createdAt: data.createdAt ?? null,
    notes: typeof data.notes === "string" ? data.notes : undefined,
    raw: data,
  };
}

// GET /api/app/sponsorship/companies - Get sponsored companies
export const GET = withApi({
  auth: "optional",
  querySchema: sponsorshipCompaniesQuerySchema,
}, async ({ query, user }) => {
  const { page, limit: limitNum, q: quickQuery, search: rawSearch, status } = query;
  const isAdmin = user?.isAdmin ?? false;
  
  const search = rawSearch?.trim() || quickQuery?.trim() || "";

    const db = getAdminDb();
    const sponsorsRef = db.collection("sponsors");
    
    // FAST PATH: Quick lookup for extension sponsor checks
    // When there's a search query with small limit, skip expensive count queries
    if (search && limitNum <= 10) {
      const searchLower = search.toLowerCase().trim();
      const searchUpper = searchLower + '\uf8ff'; // Unicode high character for range query
      
      let snapshot;
      
      // Strategy 1: Try prefix match on nameLower field (fastest if index exists)
      try {
        const prefixQuery = sponsorsRef
          .where("nameLower", ">=", searchLower)
          .where("nameLower", "<=", searchUpper)
          .where("isActive", "==", true)
          .limit(limitNum);
        
        snapshot = await prefixQuery.get();
      } catch (e) {
        snapshot = { empty: true, docs: [] };
      }
      
      // Strategy 2: Try prefix match on name field (case-sensitive but common)
      if (snapshot.empty) {
        try {
          // Try with original case first letter capitalized (common format)
          const searchCapitalized = search.charAt(0).toUpperCase() + search.slice(1).toLowerCase();
          const searchCapUpper = searchCapitalized + '\uf8ff';
          
          const nameQuery = sponsorsRef
            .where("name", ">=", searchCapitalized)
            .where("name", "<=", searchCapUpper)
            .where("isActive", "==", true)
            .limit(limitNum);
          
          snapshot = await nameQuery.get();
        } catch (e) {
          snapshot = { empty: true, docs: [] };
        }
      }
      
      // Strategy 3: Fallback - fetch batch and filter in memory
      if (snapshot.empty) {
        const fallbackQuery = sponsorsRef
          .where("isActive", "==", true)
          .orderBy("name", "asc")
          .limit(500);
        
        snapshot = await fallbackQuery.get();
      }
      
      let mappedDocs = snapshot.docs.map(mapToPublicSponsor);
      
      // Always filter by search term for accurate matching
      mappedDocs = mappedDocs.filter((company: SponsorRecord) => {
        const name = company.name?.toLowerCase() || '';
        const city = company.city?.toLowerCase() || '';
        // Match if company name contains search term or starts with it
        return name.includes(searchLower) || name.startsWith(searchLower) || city.includes(searchLower);
      });
      
      // Sort by best match (prefer exact prefix matches)
      mappedDocs.sort((a: SponsorRecord, b: SponsorRecord) => {
        const aName = a.name?.toLowerCase() || '';
        const bName = b.name?.toLowerCase() || '';
        const aStartsWith = aName.startsWith(searchLower);
        const bStartsWith = bName.startsWith(searchLower);
        if (aStartsWith && !bStartsWith) return -1;
        if (bStartsWith && !aStartsWith) return 1;
        return aName.localeCompare(bName);
      });
      
      // Take only the requested limit
      const results = mappedDocs.slice(0, limitNum);
      const publicRecords = results.map(({ raw, ...rest }: SponsorRecord) => rest);
      
      return {
        query: quickQuery,
        results: publicRecords,
        total: publicRecords.length,
        page: 1,
        limit: limitNum,
        hasMore: false,
        message: "Sponsored companies retrieved successfully",
      };
    }
    
    // STANDARD PATH: Full pagination for admin/browse views
    
    // Build query with pagination
    let dbQuery: Query = sponsorsRef.orderBy("name", "asc");
    
    // Apply status filter if needed
    if (status === "active") {
      dbQuery = dbQuery.where("isActive", "==", true);
    } else if (status === "inactive") {
      dbQuery = dbQuery.where("isActive", "==", false);
    }
    
    // Get total count only for admin views (skip for regular users to save time)
    let totalInCollection = 0;
    let filteredTotal = 0;
    
    if (isAdmin) {
      const totalSnapshot = await sponsorsRef.count().get();
      totalInCollection = totalSnapshot.data().count;
      
      const filteredCountSnapshot = await dbQuery.count().get();
      filteredTotal = filteredCountSnapshot.data().count;
    }
    
    // Apply pagination
    const offset = (page - 1) * limitNum;
    dbQuery = dbQuery.offset(offset).limit(limitNum);
    
    const snapshot = await dbQuery.get();
    
    let mappedDocs = snapshot.docs.map(mapToPublicSponsor);
    
    // If there's a text search, filter the results in memory
    if (search) {
      const searchLower = search.toLowerCase();
      mappedDocs = mappedDocs.filter((company: SponsorRecord) => {
        const fields = [company.name, company.city, company.route, company.typeRating];
        return fields.some((field) => field?.toLowerCase().includes(searchLower));
      });
    }

    // Filter out inactive for non-admins (if not already filtered by status)
    if (!isAdmin && status !== "active" && status !== "inactive") {
      mappedDocs = mappedDocs.filter((company: SponsorRecord) => company.isActive);
    }

    const hasMore = isAdmin ? (offset + mappedDocs.length < filteredTotal) : (snapshot.docs.length === limitNum);

    const publicRecords = mappedDocs.map(({ raw, ...rest }: SponsorRecord) => rest);
    const adminRecords = mappedDocs.map(({ raw, ...rest }: SponsorRecord) => ({ ...(raw ?? {}), ...rest }));
    const responseRecords = isAdmin ? adminRecords : publicRecords;

    if (quickQuery) {
      return {
        query: quickQuery,
        results: publicRecords,
        total: filteredTotal || publicRecords.length,
        page,
        limit: limitNum,
        hasMore,
        message: "Sponsored companies retrieved successfully",
      };
    }

    return {
      companies: responseRecords,
      results: publicRecords,
      total: filteredTotal || responseRecords.length,
      page,
      limit: limitNum,
      hasMore,
      totalInCollection,
      message: "Sponsored companies retrieved successfully",
  };
});

// POST /api/app/sponsorship/companies - Create new sponsored company
export const POST = withApi({
  auth: "admin",
  rateLimit: "admin",
}, async ({ request, user }) => {
  const companyData = await request.json();
  
  const db = getAdminDb();
  const docRef = await db.collection("sponsors").add({
    ...companyData,
    isActive: companyData.isActive ?? true,
    createdAt: Date.now(),
    createdBy: user!.uid
  });
  
  return {
    _id: docRef.id,
    message: 'Sponsored company created successfully'
  };
});
