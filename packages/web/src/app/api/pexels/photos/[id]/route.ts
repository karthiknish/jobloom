import { withApi } from "@/lib/api/withApi";
import { z } from "zod";
import { getPexelsPhoto } from "@/lib/integrations/pexels/server";
import { PexelsApiError } from "@/types/pexels";

const photoParamsSchema = z.object({
  id: z.string(),
});

export const GET = withApi({
  auth: 'admin',
  paramsSchema: photoParamsSchema,
}, async ({ params }) => {
  const { id: photoId } = params;

  try {
    const photo = await getPexelsPhoto(photoId);
    return photo;
  } catch (error) {
    if (error instanceof PexelsApiError) {
      return {
        status: error.status ?? 500,
        error: error.message
      };
    }

    console.error("Unexpected Pexels photo error", error);
    return {
      status: 502,
      error: "Failed to load Pexels photo"
    };
  }
});
