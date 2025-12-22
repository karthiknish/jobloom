import { withApi } from "@/lib/api/withApi";
import { z } from "zod";
import { searchPexelsPhotos } from "@/lib/integrations/pexels/server";
import { PexelsApiError } from "@/types/pexels";
import { ServiceUnavailableError } from "@/lib/api/errorResponse";

const MAX_PER_PAGE = 50;

// Zod schema for query parameters
const pexelsSearchSchema = z.object({
  query: z.string().min(1, "Missing query parameter").max(200),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(MAX_PER_PAGE).default(20),
  orientation: z.enum(["landscape", "portrait", "square"]).optional(),
});

export const GET = withApi({
  auth: 'admin',
  querySchema: pexelsSearchSchema,
}, async ({ query: validatedQuery }) => {
  const { query, page, per_page: perPage, orientation } = validatedQuery;

  const params: Record<string, string> = {
    query: query.trim(),
    page: page.toString(),
    per_page: perPage.toString(),
  };

  try {
    const data = await searchPexelsPhotos(params);
    return data;
  } catch (error) {
    if (error instanceof PexelsApiError) {
      throw new ServiceUnavailableError(
        error.message,
        "pexels",
        60
      );
    }

    console.error("Unexpected Pexels search error", error);
    throw new ServiceUnavailableError(
      "Failed to fetch images from Pexels",
      "pexels",
      60
    );
  }
});

export { OPTIONS } from "@/lib/api/withApi";
