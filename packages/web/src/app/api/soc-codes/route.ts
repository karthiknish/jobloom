import { getAdminDb } from '@/firebase/admin';
import { withApi } from '@/lib/api/withApi';
import { z } from 'zod';

// Zod schema for query parameters
const socCodesQuerySchema = z.object({
  q: z.string().max(200).optional().transform(v => v?.toLowerCase().trim()),
  code: z.string().max(50).optional().transform(v => v?.trim()),
  eligibility: z.string().max(50).optional().transform(v => v?.toLowerCase().trim()),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const GET = withApi({
  auth: 'required',
  querySchema: socCodesQuerySchema,
}, async ({ query: validatedQuery }) => {
  const { q: query, code, eligibility, limit } = validatedQuery;

  const db = getAdminDb();
  let firestoreQuery: any = db.collection('socCodes');

  // Apply filters
  if (eligibility) {
    const normalizedEligibility = eligibility.charAt(0).toUpperCase() + eligibility.slice(1) + ' Skilled';
    firestoreQuery = firestoreQuery.where('eligibility', '==', normalizedEligibility);
  }

  if (code) {
    firestoreQuery = firestoreQuery.where('code', '==', code);
  }

  let results: any[] = [];

  if (query) {
    // For text search, get all eligible codes and filter client-side
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

  return {
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
  };
});
