import { NextRequest, NextResponse } from 'next/server';

// Public endpoint for sponsors search - no authentication required
export async function GET(request: NextRequest) {
  try {
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

    // Mock sponsors data for public access
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

    return NextResponse.json({
      success: true,
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
    });

  } catch (error) {
    console.error('Error searching public sponsors:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
