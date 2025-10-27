import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/firebase/admin';
import { authenticateRequest } from '@/lib/api/auth';

const db = getAdminDb();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase().trim();
    const route = searchParams.get('route')?.toLowerCase().trim();
    const city = searchParams.get('city')?.toLowerCase().trim();
    const limit = parseInt(searchParams.get('limit') || '20');

    // If no search parameters provided, return a basic public response
    if (!query && !route && !city) {
      // Public access - return basic sponsor count or summary
      try {
        const totalSnapshot = await db.collection('sponsors').where('isActive', '==', true).count().get();
        return NextResponse.json({
          success: true,
          message: "Sponsors API - use search parameters for detailed results",
          totalActiveSponsors: totalSnapshot.data().count,
          requiresAuth: false
        });
      } catch (error) {
        console.error('Error getting sponsor count:', error);
        return NextResponse.json({
          success: true,
          message: "Sponsors API available",
          requiresAuth: false
        });
      }
    }

    // For search queries, require authentication
    const auth = await authenticateRequest(request);
    if (!auth.ok) {
      return auth.response;
    }

    let firestoreQuery = db.collection('sponsors').where('isActive', '==', true);

    // Apply filters
    if (route) {
      firestoreQuery = firestoreQuery.where('route', '==', route.charAt(0).toUpperCase() + route.slice(1));
    }

    // For text search, we'll use a different approach
    let results: any[] = [];

    if (query || city) {
      // Get all documents and filter client-side for text search
      // In production, consider using Algolia or ElasticSearch for better performance
      const snapshot = await firestoreQuery.limit(1000).get();

      results = snapshot.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() }))
        .filter((sponsor: any) => {
          const nameMatch = query ? sponsor.searchName?.includes(query) : true;
          const cityMatch = city ? sponsor.searchCity?.includes(city) : true;
          return nameMatch && cityMatch;
        })
        .slice(0, limit);
    } else {
      // Simple query without text search
      const snapshot = await firestoreQuery.limit(limit).get();
      results = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    }

    return NextResponse.json({
      success: true,
      query,
      route,
      city,
      totalResults: results.length,
      results: results.map((sponsor: any) => ({
        id: sponsor.id,
        name: sponsor.name,
        city: sponsor.city,
        county: sponsor.county,
        typeRating: sponsor.typeRating,
        route: sponsor.route,
        isSkilledWorker: sponsor.route === 'Skilled Worker'
      }))
    });

  } catch (error) {
    console.error('Error searching sponsors:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
