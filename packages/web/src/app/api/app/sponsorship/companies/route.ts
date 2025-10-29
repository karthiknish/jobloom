import { NextRequest, NextResponse } from "next/server";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

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
    const industry = searchParams.get("industry")?.trim();
    const sponsorshipType = searchParams.get("sponsorshipType")?.trim();
    const status = searchParams.get("status")?.trim() as "active" | "inactive" | "all" | undefined;

    const db = getAdminDb();
    let sponsorsQuery = db.collection("sponsors");

    if (industry && industry !== "all") {
      sponsorsQuery = sponsorsQuery.where("industry", "==", industry) as any;
    }

    if (sponsorshipType && sponsorshipType !== "all") {
      sponsorsQuery = sponsorsQuery.where("sponsorshipType", "==", sponsorshipType) as any;
    }

    if (status === "active") {
      sponsorsQuery = sponsorsQuery.where("isActive", "==", true) as any;
    } else if (status === "inactive") {
      sponsorsQuery = sponsorsQuery.where("isActive", "==", false) as any;
    }

    sponsorsQuery = sponsorsQuery.orderBy("createdAt", "desc") as any;

    const countSnapshot = await sponsorsQuery.get();
    const total = countSnapshot.size;

    let pagedQuery = sponsorsQuery.limit(limitNum) as any;
    if (page > 1) {
      pagedQuery = pagedQuery.offset((page - 1) * limitNum) as any;
    }

    const snapshot = await pagedQuery.get();

    const mapped = snapshot.docs.map(mapToPublicSponsor);

    let filtered: SponsorRecord[] = mapped;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = mapped.filter((company: SponsorRecord) => {
        const fields = [company.name, company.city, company.route, company.typeRating];
        return fields.some((field) => field?.toLowerCase().includes(searchLower));
      });
    }

    if (!auth.isAdmin) {
      filtered = filtered.filter((company: SponsorRecord) => company.isActive);
    }

    const hasMore = page * limitNum < total;

    const publicRecords = filtered.map(({ raw, ...rest }: SponsorRecord) => rest);
    const adminRecords = filtered.map(({ raw, ...rest }: SponsorRecord) => ({ ...(raw ?? {}), ...rest }));
    const responseRecords = auth.isAdmin ? adminRecords : publicRecords;

    if (quickQuery) {
      return NextResponse.json({
        query: quickQuery,
        results: publicRecords.slice(0, limitNum),
        total: publicRecords.length,
        page,
        limit: limitNum,
        hasMore,
        message: "Sponsored companies retrieved successfully",
      });
    }

    return NextResponse.json({
      companies: responseRecords,
      results: publicRecords,
      total,
      page,
      limit: limitNum,
      hasMore,
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