import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuth, getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";

// Zod schema for request body validation
const resetBodySchema = z.object({
  token: z.string().min(1, "Invalid or missing token"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export const POST = withApi({
  auth: "none",
  rateLimit: "auth",
  bodySchema: resetBodySchema,
  handler: async ({ body }) => {
    const { token, password } = body;

    const db = getAdminDb();
    const tokenDoc = await db.collection("passwordResets").doc(token).get();

    if (!tokenDoc.exists) {
      return {
        error: "Reset link is invalid or expired",
        code: "INVALID_TOKEN"
      };
    }

    const tokenData = tokenDoc.data() as {
      userId: string;
      email: string;
      expiresAt: FirebaseFirestore.Timestamp | Date;
      used?: boolean;
    };

    if (!tokenData || !tokenData.userId || tokenData.used) {
      return {
        error: "Reset link has already been used",
        code: "TOKEN_ALREADY_USED"
      };
    }

    const expiresAt = tokenData.expiresAt instanceof Date ? tokenData.expiresAt : tokenData.expiresAt.toDate();
    if (expiresAt.getTime() < Date.now()) {
      await tokenDoc.ref.update({ used: true, expiredAt: new Date() });
      return {
        error: "Reset link has expired",
        code: "TOKEN_EXPIRED"
      };
    }

    const auth = getAdminAuth();
    await auth.updateUser(tokenData.userId, { password });
    await tokenDoc.ref.update({ used: true, consumedAt: new Date() });

    return { success: true };
  },
});
