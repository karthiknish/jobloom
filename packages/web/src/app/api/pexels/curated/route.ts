import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { getPexelsCuratedPhotos } from "@/lib/integrations/pexels/server";
import { PexelsApiError } from "@/types/pexels";

const MAX_PER_PAGE = 50;

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, { requireAdmin: true });
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10));
  const perPageRaw = Number.parseInt(url.searchParams.get("per_page") || "20", 10);
  const perPage = Math.min(Math.max(perPageRaw, 1), MAX_PER_PAGE);

  const params: Record<string, string> = {
    page: page.toString(),
    per_page: perPage.toString(),
  };

  try {
    const data = await getPexelsCuratedPhotos(params);
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    if (error instanceof PexelsApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status ?? 500 });
    }

    console.error("Unexpected Pexels curated error", error);
    return NextResponse.json({ error: "Failed to load curated images" }, { status: 502 });
  }
}
