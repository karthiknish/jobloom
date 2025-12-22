import { z } from 'zod';
import { withApi } from "@/lib/api/withApi";
import { ValidationError } from "@/lib/api/errorResponse";

// Zod schema for query parameters
const sponsorsQuerySchema = z.object({
  q: z.string().max(200).optional().transform(v => v?.toLowerCase().trim()),
  route: z.string().max(100).optional().transform(v => v?.toLowerCase().trim()),
  city: z.string().max(100).optional().transform(v => v?.toLowerCase().trim()),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Protected endpoint for sponsors search - authentication required
export const GET = withApi({
  auth: "required",
  querySchema: sponsorsQuerySchema,
}, async ({ query: queryParams }) => {
  const { q: query, route, city, limit } = queryParams;

  if (!query && !route && !city) {
    throw new ValidationError(
      'At least one search parameter (q, route, or city) is required',
      "queryParams"
    );
  }

  // Mock sponsors data for authenticated access
  const mockSponsors = [
    {
      id: "1",
      name: "Google",
      city: "London",
      county: "Greater London",
      typeRating: "AA",
      route: "Skilled Worker",
      isSkilledWorker: true
    },
    {
      id: "2",
      name: "Microsoft",
      city: "Reading",
      county: "Berkshire",
      typeRating: "AA",
      route: "Skilled Worker",
      isSkilledWorker: true
    },
    {
      id: "3",
      name: "Amazon",
      city: "London",
      county: "Greater London",
      typeRating: "AA",
      route: "Skilled Worker",
      isSkilledWorker: true
    },
    {
      id: "4",
      name: "Meta",
      city: "London",
      county: "Greater London",
      typeRating: "AA",
      route: "Skilled Worker",
      isSkilledWorker: true
    },
    {
      id: "5",
      name: "Netflix",
      city: "London",
      county: "Greater London",
      typeRating: "AA",
      route: "Skilled Worker",
      isSkilledWorker: true
    },
    {
      id: "6",
      name: "Apple",
      city: "London",
      county: "Greater London",
      typeRating: "AA",
      route: "Skilled Worker",
      isSkilledWorker: true
    },
    {
      id: "7",
      name: "Tesla",
      city: "London",
      county: "Greater London",
      typeRating: "AA",
      route: "Skilled Worker",
      isSkilledWorker: true
    },
    {
      id: "8",
      name: "IBM",
      city: "London",
      county: "Greater London",
      typeRating: "AA",
      route: "Skilled Worker",
      isSkilledWorker: true
    }
  ];

  let results = mockSponsors;

  // Apply route filter
  if (route) {
    results = results.filter(sponsor =>
      sponsor.route.toLowerCase().includes(route)
    );
  }

  // Apply text search
  if (query || city) {
    results = results.filter(sponsor => {
      const nameMatch = query ? sponsor.name.toLowerCase().includes(query) : true;
      const cityMatch = city ? sponsor.city.toLowerCase().includes(city) : true;
      return nameMatch && cityMatch;
    });
  }

  // Apply limit
  results = results.slice(0, limit);

  return {
    query,
    route,
    city,
    totalResults: results.length,
    results: results.map(sponsor => ({
      id: sponsor.id,
      name: sponsor.name,
      city: sponsor.city,
      county: sponsor.county,
      typeRating: sponsor.typeRating,
      route: sponsor.route,
      isSkilledWorker: sponsor.isSkilledWorker
    }))
  };
});

export { OPTIONS } from "@/lib/api/withApi";
