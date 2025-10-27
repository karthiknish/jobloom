import { PexelsApiError, type PexelsPhoto, type PexelsSearchResponse } from "@/types/pexels";

const ORIENTATION_VALUES = ["landscape", "portrait", "square"] as const;
const ORIENTATION_WHITELIST = new Set<string>(ORIENTATION_VALUES);

function resolveApiBase(): string {
  if (typeof window !== "undefined") {
    return "";
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  if (process.env.VERCEL_URL) {
    const hasProtocol = process.env.VERCEL_URL.startsWith("http://") || process.env.VERCEL_URL.startsWith("https://");
    return hasProtocol ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

class PexelsApiClient {
  private readonly apiBase: string;

  constructor() {
    this.apiBase = resolveApiBase();
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const searchParams = new URLSearchParams(params);
    const url = `${this.apiBase}/api/pexels${endpoint}${searchParams.size ? `?${searchParams.toString()}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "same-origin",
      cache: "no-store",
    });

    if (!response.ok) {
      let message = `Pexels request failed (${response.status})`;

      if (response.status === 429) {
        message = "Rate limit exceeded. Please try again later.";
      } else {
        try {
          const errorBody = await response.clone().json();
          if (errorBody && typeof errorBody.error === "string") {
            message = errorBody.error;
          }
        } catch {
          const text = await response.text().catch(() => null);
          if (text) {
            message = text;
          }
        }
      }

      throw new PexelsApiError(message, response.status);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Search for photos
   */
  async searchPhotos(
    query: string,
    options: {
      page?: number;
      per_page?: number;
      orientation?: "landscape" | "portrait" | "square";
    } = {}
  ): Promise<PexelsSearchResponse> {
    const params: Record<string, string> = {
      query,
      page: String(options.page && options.page > 0 ? options.page : 1),
      per_page: String(options.per_page && options.per_page > 0 ? Math.min(options.per_page, 50) : 20),
    };

    if (options.orientation && ORIENTATION_WHITELIST.has(options.orientation)) {
      params.orientation = options.orientation;
    }

    return this.request<PexelsSearchResponse>("/search", params);
  }

  /**
   * Get curated photos
   */
  async getCuratedPhotos(
    options: {
      page?: number;
      per_page?: number;
    } = {}
  ): Promise<PexelsSearchResponse> {
    const params: Record<string, string> = {
      page: String(options.page && options.page > 0 ? options.page : 1),
      per_page: String(options.per_page && options.per_page > 0 ? Math.min(options.per_page, 50) : 20),
    };

    return this.request<PexelsSearchResponse>("/curated", params);
  }

  /**
   * Get photo by ID
   */
  async getPhoto(id: number): Promise<PexelsPhoto> {
    return this.request<PexelsPhoto>(`/photos/${id}`);
  }
}

// Export singleton instance
export const pexelsApi = new PexelsApiClient();