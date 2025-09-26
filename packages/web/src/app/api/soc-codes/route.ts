import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

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
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase().trim();
    const code = searchParams.get('code')?.trim();
    const eligibility = searchParams.get('eligibility')?.toLowerCase().trim();
    const limit = parseInt(searchParams.get('limit') || '20');

    let firestoreQuery: any = db.collection('socCodes');

    // Apply filters
    if (eligibility) {
      firestoreQuery = firestoreQuery.where('eligibility', '==',
        eligibility.charAt(0).toUpperCase() + eligibility.slice(1) + ' Skilled'
      );
    }

    if (code) {
      firestoreQuery = firestoreQuery.where('code', '==', code);
    }

    let results: any[] = [];

    if (query) {
      // For text search, get all eligible codes and filter client-side
      // In production, consider using Algolia for better full-text search
      const snapshot = await firestoreQuery.limit(500).get();

      results = snapshot.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() }))
        .filter((item: any) => {
          const jobMatch = item.jobType?.toLowerCase().includes(query);
          const titleMatch = item.relatedTitles?.some((title: string) =>
            title.toLowerCase().includes(query)
          );
          const searchTermsMatch = item.searchTerms?.includes(query);
          return jobMatch || titleMatch || searchTermsMatch;
        })
        .slice(0, limit);
    } else {
      // Simple query
      const snapshot = await firestoreQuery.limit(limit).get();
      results = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    }

    return NextResponse.json({
      success: true,
      query,
      code,
      eligibility,
      totalResults: results.length,
      results: results.map(item => ({
        id: item.id,
        code: item.code,
        jobType: item.jobType,
        relatedTitles: item.relatedTitles || [],
        eligibility: item.eligibility,
        isEligible: item.eligibility !== 'Ineligible'
      }))
    });

  } catch (error) {
    console.error('Error searching SOC codes:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
