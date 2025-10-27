import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { searchPexelsPhotos } from "@/lib/integrations/pexels/server";
import { PexelsApiError } from "@/types/pexels";

const ORIENTATION_VALUES = new Set(["landscape", "portrait", "square"]);
const MAX_PER_PAGE = 50;

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, { requireAdmin: true });
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("query");

  if (!query || !query.trim()) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10));
  const perPageRaw = Number.parseInt(url.searchParams.get("per_page") || "20", 10);
  const perPage = Math.min(Math.max(perPageRaw, 1), MAX_PER_PAGE);
  const orientation = url.searchParams.get("orientation") || undefined;

  const params: Record<string, string> = {
    query: query.trim(),
    page: page.toString(),
    per_page: perPage.toString(),
  };

  if (orientation && ORIENTATION_VALUES.has(orientation)) {
    params.orientation = orientation;
  }

  try {
    const data = await searchPexelsPhotos(params);
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    if (error instanceof PexelsApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status ?? 500 });
    }

    console.error("Unexpected Pexels search error", error);
    return NextResponse.json({ error: "Failed to fetch images from Pexels" }, { status: 502 });
  }
}
