import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb } from "@/firebase/admin";
import {
  withErrorHandling,
  validateAuthHeader,
  createAuthorizationError,
  generateRequestId
} from "@/lib/api/errors";

interface SponsoredCompany {
  _id: string;
  industry?: string;
  sponsorshipType?: string;
  isActive?: boolean;
  [key: string]: any;
}

// GET /api/app/sponsorship/stats - Get sponsorship statistics (admin only)
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  return withErrorHandling(async () => {
    // Validate authorization
    const token = validateAuthHeader(request);
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      throw createAuthorizationError("Invalid authentication token", 'INVALID_TOKEN');
    }

    // Check admin permissions
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      throw createAuthorizationError("Admin access required", 'INSUFFICIENT_PERMISSIONS');
    }

    // Fetch sponsorship statistics
    const companiesSnapshot = await db.collection("sponsoredCompanies").get();
    const companies = companiesSnapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    })) as SponsoredCompany[];

    // Calculate industry statistics
    const industryStats: Record<string, number> = {};
    const sponsorshipTypeStats: Record<string, number> = {};

    companies.forEach(company => {
      const industry = company.industry || "Unknown";
      const sponsorshipType = company.sponsorshipType || "sponsored";

      industryStats[industry] = (industryStats[industry] || 0) + 1;
      sponsorshipTypeStats[sponsorshipType] = (sponsorshipTypeStats[sponsorshipType] || 0) + 1;
    });

    const stats = {
      totalSponsoredCompanies: companies.length,
      industryStats,
      sponsorshipTypeStats,
      activeCompanies: companies.filter(c => c.isActive !== false).length,
      inactiveCompanies: companies.filter(c => c.isActive === false).length,
      lastUpdated: Date.now()
    };

    return NextResponse.json(stats);
  }, {
    endpoint: '/api/app/sponsorship/stats',
    method: 'GET',
    requestId
  });
}
