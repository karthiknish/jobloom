import { PexelsApiError, type PexelsPhoto, type PexelsSearchResponse } from "@/types/pexels";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || process.env.NEXT_PUBLIC_PEXELS_API_KEY || "";
const PEXELS_BASE_URL = "https://api.pexels.com/v1";

function buildUrl(endpoint: string, params: Record<string, string | null | undefined> = {}): string {
  const url = new URL(`${PEXELS_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

async function executePexelsRequest<T>(endpoint: string, params?: Record<string, string | null | undefined>): Promise<T> {
  if (!PEXELS_API_KEY) {
    throw new PexelsApiError("Pexels API key not configured", 503);
  }

  const response = await fetch(buildUrl(endpoint, params), {
    headers: {
      Authorization: PEXELS_API_KEY,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 429) {
    throw new PexelsApiError("Pexels rate limit exceeded. Please try again later.", 429);
  }

  if (!response.ok) {
    let message = `Pexels API error: ${response.status}`;

    try {
      const body = await response.clone().json();
      if (body && typeof body.error === "string") {
        message = body.error;
      }
    } catch {
      const text = await response.text().catch(() => null);
      if (text) {
        message = text;
      }
    }

    throw new PexelsApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export async function searchPexelsPhotos(params: Record<string, string>): Promise<PexelsSearchResponse> {
  return executePexelsRequest<PexelsSearchResponse>("/search", params);
}

export async function getPexelsCuratedPhotos(params: Record<string, string>): Promise<PexelsSearchResponse> {
  return executePexelsRequest<PexelsSearchResponse>("/curated", params);
}

export async function getPexelsPhoto(id: string): Promise<PexelsPhoto> {
  return executePexelsRequest<PexelsPhoto>(`/photos/${id}`);
}
