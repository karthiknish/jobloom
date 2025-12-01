import { NextRequest, NextResponse } from "next/server";
import type { QueryDocumentSnapshot, Query } from "firebase-admin/firestore";

import { getAdminDb } from "@/firebase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { withErrorHandling, generateRequestId } from "@/lib/api/errors";

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

// GET /api/app/sponsorship/companies - Get sponsored companies (admin only)
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    const auth = await authenticateRequest(request, {
      loadUser: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);

    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

    const rawLimit = parseInt(searchParams.get("limit") || "50", 10);
    const limitNum = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 50;

    const quickQuery = searchParams.get("q")?.trim() || "";
    const search = searchParams.get("search")?.trim() || quickQuery;
    const status = searchParams.get("status")?.trim() as "active" | "inactive" | "all" | undefined;

    console.log('[GET /api/app/sponsorship/companies] Starting request, requestId:', requestId);
    console.log('[GET /api/app/sponsorship/companies] Params:', { page, limit: limitNum, search, status });

    const db = getAdminDb();
    const sponsorsRef = db.collection("sponsors");
    
    // Get total count
    const totalSnapshot = await sponsorsRef.count().get();
    const totalInCollection = totalSnapshot.data().count;
    console.log('[GET /api/app/sponsorship/companies] Total sponsors in collection:', totalInCollection);

    // Build query with pagination
    // Note: For large collections, we use simple limit/offset pagination
    // More advanced cursor-based pagination would be better for very large offsets
    let query: Query = sponsorsRef.orderBy("name", "asc");
    
    // Apply status filter if needed (this is a simple equality filter)
    if (status === "active") {
      query = query.where("isActive", "==", true);
    } else if (status === "inactive") {
      query = query.where("isActive", "==", false);
    }
    
    // Get count for the filtered query
    const filteredCountSnapshot = await query.count().get();
    const filteredTotal = filteredCountSnapshot.data().count;
    console.log('[GET /api/app/sponsorship/companies] Filtered total:', filteredTotal);
    
    // Apply pagination
    const offset = (page - 1) * limitNum;
    query = query.offset(offset).limit(limitNum);
    
    const snapshot = await query.get();
    console.log('[GET /api/app/sponsorship/companies] Fetched docs count:', snapshot.docs.length);
    
    let mappedDocs = snapshot.docs.map(mapToPublicSponsor);
    
    // If there's a text search, filter the results in memory
    // Note: For production, consider using Firestore full-text search extensions
    // or a dedicated search service like Algolia/Elasticsearch
    if (search) {
      const searchLower = search.toLowerCase();
      mappedDocs = mappedDocs.filter((company: SponsorRecord) => {
        const fields = [company.name, company.city, company.route, company.typeRating];
        return fields.some((field) => field?.toLowerCase().includes(searchLower));
      });
    }

    // Filter out inactive for non-admins (if not already filtered by status)
    if (!auth.isAdmin && status !== "active" && status !== "inactive") {
      mappedDocs = mappedDocs.filter((company: SponsorRecord) => company.isActive);
    }

    const hasMore = offset + mappedDocs.length < filteredTotal;

    const publicRecords = mappedDocs.map(({ raw, ...rest }: SponsorRecord) => rest);
    const adminRecords = mappedDocs.map(({ raw, ...rest }: SponsorRecord) => ({ ...(raw ?? {}), ...rest }));
    const responseRecords = auth.isAdmin ? adminRecords : publicRecords;

    console.log('[GET /api/app/sponsorship/companies] Returning', responseRecords.length, 'records');

    if (quickQuery) {
      return NextResponse.json({
        query: quickQuery,
        results: publicRecords,
        total: filteredTotal,
        page,
        limit: limitNum,
        hasMore,
        message: "Sponsored companies retrieved successfully",
      });
    }

    return NextResponse.json({
      companies: responseRecords,
      results: publicRecords,
      total: filteredTotal,
      page,
      limit: limitNum,
      hasMore,
      totalInCollection,
      message: "Sponsored companies retrieved successfully",
    });
  }, {
    endpoint: '/api/app/sponsorship/companies',
    method: 'GET',
    requestId,
  });
}

// POST /api/app/sponsorship/companies - Create new sponsored company
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    const auth = await authenticateRequest(request, {
      requireAdmin: true,
      loadUser: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const companyData = await request.json();
    
    const db = getAdminDb();
    const docRef = await db.collection("sponsors").add({
      ...companyData,
      isActive: companyData.isActive ?? true,
      createdAt: Date.now(),
      createdBy: auth.token.uid
    });
    
    return NextResponse.json({
      _id: docRef.id,
      message: 'Sponsored company created successfully'
    });
  }, {
    endpoint: '/api/app/sponsorship/companies',
    method: 'POST',
    requestId
  });
}