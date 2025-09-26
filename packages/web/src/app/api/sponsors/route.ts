import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { verifyIdToken } from '@/firebase/admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  });
}

const db = getFirestore();

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase().trim();
    const route = searchParams.get('route')?.toLowerCase().trim();
    const city = searchParams.get('city')?.toLowerCase().trim();
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query && !route && !city) {
      return NextResponse.json({
        error: 'At least one search parameter (q, route, or city) is required'
      }, { status: 400 });
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
