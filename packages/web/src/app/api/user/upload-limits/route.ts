import { NextRequest, NextResponse } from "next/server";
import { withApi } from "@/lib/api/withApi";
import { getUploadLimitsForUser, DEFAULT_UPLOAD_LIMITS } from "@/config/uploadLimits";

// GET /api/user/upload-limits - Get upload limits for the current user
export const GET = withApi({
  auth: "required",
}, async ({ user }) => {
  try {
    const uploadLimits = await getUploadLimitsForUser(user!.uid);

    return {
      uploadLimits: {
        maxSize: uploadLimits.maxSize,
        maxSizeMB: uploadLimits.maxSizeMB,
        allowedTypes: uploadLimits.allowedTypes,
        allowedExtensions: uploadLimits.allowedExtensions,
        description: uploadLimits.description
      }
    };
  } catch (error) {
    console.error("Error fetching upload limits:", error);
    
    // Return default limits on error but still wrapped in success: true for robustness
    // or we could let withApi handle the error if we want it to fail
    return {
      uploadLimits: {
        maxSize: DEFAULT_UPLOAD_LIMITS.maxSize,
        maxSizeMB: DEFAULT_UPLOAD_LIMITS.maxSizeMB,
        allowedTypes: DEFAULT_UPLOAD_LIMITS.allowedTypes,
        allowedExtensions: DEFAULT_UPLOAD_LIMITS.allowedExtensions,
        description: DEFAULT_UPLOAD_LIMITS.description
      }
    };
  }
});
