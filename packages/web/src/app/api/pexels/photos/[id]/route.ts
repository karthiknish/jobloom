import { withApi } from "@/lib/api/withApi";
import { z } from "zod";
import { getPexelsPhoto } from "@/lib/integrations/pexels/server";
import { PexelsApiError } from "@/types/pexels";
import { ServiceUnavailableError } from "@/lib/api/errorResponse";

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
      throw new ServiceUnavailableError(
        error.message,
        "pexels",
        60
      );
    }

    console.error("Unexpected Pexels photo error", error);
    throw new ServiceUnavailableError(
      "Failed to load Pexels photo",
      "pexels",
      60
    );
  }
});

export { OPTIONS } from "@/lib/api/withApi";
