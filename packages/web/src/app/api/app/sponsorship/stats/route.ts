import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import {
  withErrorHandling,
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
    console.log('Sponsorship stats API called, requestId:', requestId);
    
    // Validate authorization
    const auth = await authenticateRequest(request, {
      requireAdmin: true,
      loadUser: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    // Fetch sponsorship statistics
    console.log('Fetching sponsorship statistics...');
    
    // Initialize Firestore
    const db = getAdminDb();
    
    // Get total count efficiently
    const sponsorsRef = db.collection("sponsors");
    const totalSnapshot = await sponsorsRef.count().get();
    const totalSponsoredCompanies = totalSnapshot.data().count;
    
    console.log('Total sponsors count:', totalSponsoredCompanies);
    
    // For detailed stats, sample a subset of documents
    // In production, this should use aggregation queries or maintained counters
    const sampleQuery = sponsorsRef.limit(1000);
    const sampleSnapshot = await sampleQuery.get();
    const sampleCompanies = sampleSnapshot.docs.map((doc: any) => ({
      _id: doc.id,
      ...doc.data()
    })) as SponsoredCompany[];
    
    console.log('Sampled', sampleCompanies.length, 'companies for stats calculation');
    
    // Calculate industry statistics from sample
    const industryStats: Record<string, number> = {};
    const sponsorshipTypeStats: Record<string, number> = {};

    sampleCompanies.forEach(company => {
      const industry = company.industry || "Unknown";
      const sponsorshipType = company.sponsorshipType || "sponsored";
      
      industryStats[industry] = (industryStats[industry] || 0) + 1;
      sponsorshipTypeStats[sponsorshipType] = (sponsorshipTypeStats[sponsorshipType] || 0) + 1;
    });

    // Estimate active/inactive based on sample
    const activeCompanies = sampleCompanies.filter(c => c.isActive !== false).length;
    const inactiveCompanies = sampleCompanies.filter(c => c.isActive === false).length;

    const stats = {
      totalSponsoredCompanies,
      industryStats,
      sponsorshipTypeStats,
      activeCompanies: Math.round((activeCompanies / sampleCompanies.length) * totalSponsoredCompanies),
      inactiveCompanies: Math.round((inactiveCompanies / sampleCompanies.length) * totalSponsoredCompanies),
      lastUpdated: Date.now(),
      note: "Stats calculated from sample of 1000 sponsors"
    };    return NextResponse.json(stats);
  }, {
    endpoint: '/api/app/sponsorship/stats',
    method: 'GET',
    requestId
  });
}
