import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { getUploadLimitsForUser } from "@/config/uploadLimits";

// GET /api/user/upload-limits - Get upload limits for the current user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const uploadLimits = await getUploadLimitsForUser(userId);

    return NextResponse.json({
      success: true,
      uploadLimits: {
        maxSize: uploadLimits.maxSize,
        maxSizeMB: uploadLimits.maxSizeMB,
        allowedTypes: uploadLimits.allowedTypes,
        allowedExtensions: uploadLimits.allowedExtensions,
        description: uploadLimits.description
      }
    });

  } catch (error: any) {
    console.error("Error fetching upload limits:", error);
    
    // Return default limits on error
    const { DEFAULT_UPLOAD_LIMITS } = await import("@/config/uploadLimits");
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch upload limits",
      uploadLimits: {
        maxSize: DEFAULT_UPLOAD_LIMITS.maxSize,
        maxSizeMB: DEFAULT_UPLOAD_LIMITS.maxSizeMB,
        allowedTypes: DEFAULT_UPLOAD_LIMITS.allowedTypes,
        allowedExtensions: DEFAULT_UPLOAD_LIMITS.allowedExtensions,
        description: DEFAULT_UPLOAD_LIMITS.description
      }
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
