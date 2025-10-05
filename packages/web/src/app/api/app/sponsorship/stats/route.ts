import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminDb } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";
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
    console.log('🔍 Sponsorship stats API called, requestId:', requestId);
    
    // Validate authorization
    const decodedToken = await verifySessionFromRequest(request);
    if (!decodedToken) {
      console.log('❌ No decoded token - unauthorized');
      throw createAuthorizationError("Invalid authentication token", 'INVALID_TOKEN');
    }

    console.log('✅ Decoded token received:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      hasUid: !!decodedToken.uid
    });

    // Check admin permissions
    const db = getAdminDb();
    console.log('🔍 Attempting to get user document for uid:', decodedToken.uid);
    
    try {
      const userDoc = await db.collection("users").doc(decodedToken.uid).get();
      console.log('🔍 User document fetch result:', {
        exists: userDoc.exists,
        hasData: !!userDoc.data()
      });
      
      if (!userDoc.exists || !userDoc.data()?.isAdmin) {
        console.log('❌ User is not admin or document does not exist');
        throw createAuthorizationError("Admin access required", 'INSUFFICIENT_PERMISSIONS');
      }
      
      console.log('✅ User is admin, proceeding with stats fetch');
    } catch (firestoreError: any) {
      console.error('❌ Firestore error when checking user document:', {
        message: firestoreError.message,
        code: firestoreError.code,
        stack: firestoreError.stack
      });
      throw firestoreError; // Re-throw to be handled by withErrorHandling
    }

    // Fetch sponsorship statistics
    console.log('🔍 Fetching sponsorship statistics...');
    
    // Get total count efficiently
    const sponsorsRef = db.collection("sponsors");
    const totalSnapshot = await sponsorsRef.count().get();
    const totalSponsoredCompanies = totalSnapshot.data().count;
    
    console.log('✅ Total sponsors count:', totalSponsoredCompanies);
    
    // For detailed stats, sample a subset of documents
    // In production, this should use aggregation queries or maintained counters
    const sampleQuery = sponsorsRef.limit(1000);
    const sampleSnapshot = await sampleQuery.get();
    const sampleCompanies = sampleSnapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    })) as SponsoredCompany[];
    
    console.log('✅ Sampled', sampleCompanies.length, 'companies for stats calculation');
    
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
