import { withApi } from "@/lib/api/withApi";
import { z } from "zod";
import { getPexelsCuratedPhotos } from "@/lib/integrations/pexels/server";
import { PexelsApiError } from "@/types/pexels";

const MAX_PER_PAGE = 50;

// Zod schema for query parameters
const pexelsCuratedSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(MAX_PER_PAGE).default(20),
});

export const GET = withApi({
  auth: 'admin',
  querySchema: pexelsCuratedSchema,
}, async ({ query }) => {
  const { page, per_page: perPage } = query;

  const params: Record<string, string> = {
    page: page.toString(),
    per_page: perPage.toString(),
  };

  try {
    const data = await getPexelsCuratedPhotos(params);
    return data;
  } catch (error) {
    if (error instanceof PexelsApiError) {
      return {
        status: error.status ?? 500,
        error: error.message
      };
    }

    console.error("Unexpected Pexels curated error", error);
    return {
      status: 502,
      error: "Failed to load curated images"
    };
  }
});
