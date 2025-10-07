// services/pexelsApi.ts
export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

export interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

export class PexelsApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "PexelsApiError";
  }
}

class PexelsApiClient {
  private apiKey: string;
  private baseUrl = "https://api.pexels.com/v1";

  constructor() {
    // Get API key from environment variables
    this.apiKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY || "";
    if (!this.apiKey) {
      console.warn("Pexels API key not found. Image search will not work.");
    }
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.apiKey) {
      throw new PexelsApiError("Pexels API key not configured");
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: this.apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new PexelsApiError("Rate limit exceeded. Please try again later.", 429);
      }
      throw new PexelsApiError(`Pexels API error: ${response.status}`, response.status);
    }

    return response.json();
  }

  /**
   * Search for photos
   */
  async searchPhotos(query: string, options: {
    page?: number;
    per_page?: number;
    orientation?: "landscape" | "portrait" | "square";
  } = {}): Promise<PexelsSearchResponse> {
    const params: Record<string, string> = {
      query,
      page: (options.page || 1).toString(),
      per_page: (options.per_page || 15).toString(),
    };

    if (options.orientation) {
      params.orientation = options.orientation;
    }

    return this.request<PexelsSearchResponse>("/search", params);
  }

  /**
   * Get curated photos
   */
  async getCuratedPhotos(options: {
    page?: number;
    per_page?: number;
  } = {}): Promise<PexelsSearchResponse> {
    const params: Record<string, string> = {
      page: (options.page || 1).toString(),
      per_page: (options.per_page || 15).toString(),
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