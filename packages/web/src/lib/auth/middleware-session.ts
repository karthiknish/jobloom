import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/firebase/admin";
import { hashSessionToken } from "@/lib/security/csrf";
import { SecurityLogger } from "@/utils/security";

type VerifiedSessionClaims = {
  uid: string;
  email?: string;
  isAdmin: boolean;
  expiresAt: number;
  raw: Record<string, unknown>;
};

export async function verifySessionCookieForMiddleware(
  token: string,
): Promise<VerifiedSessionClaims | null> {
  try {
    const auth = getAuth(getAdminApp());
    const decoded = await auth.verifySessionCookie(token, true);
    
    if (!decoded || !decoded.uid) {
      return null;
    }

    const uid = decoded.uid;
    const email = decoded.email || undefined;
    const expiresAt = decoded.exp ? decoded.exp * 1000 : Date.now() + 5 * 60 * 1000;

    // Check admin status from custom claims
    // Firebase Admin SDK provides custom claims in the decoded token
    const customClaims = decoded as any;
    const isAdmin = Boolean(
      customClaims.admin === true ||
      customClaims.role === "admin" ||
      (customClaims.customClaims && customClaims.customClaims.admin === true)
    );

    const claims: VerifiedSessionClaims = {
      uid,
      email,
      isAdmin,
      expiresAt,
      raw: decoded,
    };

    return claims;
  } catch (error) {
    SecurityLogger.logSecurityEvent({
      type: "auth_failure",
      severity: "medium",
      details: {
        reason: "middleware_session_verification_failed",
        error: error instanceof Error ? error.message : "unknown",
      },
    });
    return null;
  }
}
