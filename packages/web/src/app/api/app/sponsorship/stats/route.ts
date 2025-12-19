import { getAdminDb } from "@/firebase/admin";
import { withApi, OPTIONS } from "@/lib/api/withApi";

export { OPTIONS };

interface SponsoredCompany {
  _id: string;
  industry?: string;
  sponsorshipType?: string;
  isActive?: boolean;
  [key: string]: any;
}

// GET /api/app/sponsorship/stats - Get sponsorship statistics (admin only)
export const GET = withApi({
  auth: 'admin',
  rateLimit: 'admin',
}, async () => {
  // Initialize Firestore
  const db = getAdminDb();
  
  // Get total count efficiently
  const sponsorsRef = db.collection("sponsors");
  const totalSnapshot = await sponsorsRef.count().get();
  const totalSponsoredCompanies = totalSnapshot.data().count;
  
  // For detailed stats, sample a subset of documents
  // In production, this should use aggregation queries or maintained counters
  const sampleQuery = sponsorsRef.limit(1000);
  const sampleSnapshot = await sampleQuery.get();
  const sampleCompanies = sampleSnapshot.docs.map((doc: any) => ({
    _id: doc.id,
    ...doc.data()
  })) as SponsoredCompany[];
  
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

  return {
    totalSponsoredCompanies,
    industryStats,
    sponsorshipTypeStats,
    activeCompanies: Math.round((activeCompanies / sampleCompanies.length) * totalSponsoredCompanies),
    inactiveCompanies: Math.round((inactiveCompanies / sampleCompanies.length) * totalSponsoredCompanies),
    lastUpdated: Date.now(),
    note: "Stats calculated from sample of 1000 sponsors"
  };
});
