import { z } from "zod";
import { getAdminAuth, getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { ValidationError } from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";

// Zod schema for request body validation
const resetBodySchema = z.object({
  token: z.string().min(1, "Invalid or missing token"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const POST = withApi({
  auth: "none",
  rateLimit: "auth",
  bodySchema: resetBodySchema,
}, async ({ body }) => {
  const { token, password } = body;

  const db = getAdminDb();
  const tokenDoc = await db.collection("passwordResets").doc(token).get();

  if (!tokenDoc.exists) {
    throw new ValidationError(
      "Reset link is invalid or expired",
      "token",
      ERROR_CODES.INVALID_TOKEN
    );
  }

  const tokenData = tokenDoc.data() as {
    userId: string;
    email: string;
    expiresAt: FirebaseFirestore.Timestamp | Date;
    used?: boolean;
  };

  if (!tokenData || !tokenData.userId || tokenData.used) {
    throw new ValidationError(
      "Reset link has already been used",
      "token",
      ERROR_CODES.TOKEN_EXPIRED
    );
  }

  const expiresAt = tokenData.expiresAt instanceof Date ? tokenData.expiresAt : tokenData.expiresAt.toDate();
  if (expiresAt.getTime() < Date.now()) {
    await tokenDoc.ref.update({ used: true, expiredAt: new Date() });
    throw new ValidationError(
      "Reset link has expired",
      "token",
      ERROR_CODES.TOKEN_EXPIRED
    );
  }

  const auth = getAdminAuth();
  await auth.updateUser(tokenData.userId, { password });
  await tokenDoc.ref.update({ used: true, consumedAt: new Date() });

  return { success: true };
});

export { OPTIONS } from "@/lib/api/withApi";
