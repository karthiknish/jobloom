import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { getPexelsPhoto } from "@/lib/integrations/pexels/server";
import { PexelsApiError } from "@/types/pexels";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request, { requireAdmin: true });
  if (!auth.ok) {
    return auth.response;
  }

  const { id: photoId } = await params;
  if (!photoId) {
    return NextResponse.json({ error: "Missing photo id" }, { status: 400 });
  }

  try {
    const photo = await getPexelsPhoto(photoId);
    return NextResponse.json(photo, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=600",
      },
    });
  } catch (error) {
    if (error instanceof PexelsApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status ?? 500 });
    }

    console.error("Unexpected Pexels photo error", error);
    return NextResponse.json({ error: "Failed to load Pexels photo" }, { status: 502 });
  }
}
