import { getAdminApp, getAdminAuth } from "@/firebase/admin";
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
    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(token, true);
    
    if (!decoded || !decoded.uid) {
      return null;
    }

    const uid = decoded.uid;
    const email = decoded.email || undefined;
    const expiresAt = decoded.exp ? decoded.exp * 1000 : Date.now() + 5 * 60 * 1000;

    // Check admin status from custom claims
    const customClaims = decoded as any;
    const hasAdminClaim = Boolean(
      customClaims.admin === true ||
      customClaims.role === "admin" ||
      (customClaims.customClaims && customClaims.customClaims.admin === true)
    );

    // DOUBLE-CHECK: Verify admin status against the database to prevent stale claims
    let isAdmin = false;
    if (hasAdminClaim) {
      try {
        const { getAdminDb } = await import("@/firebase/admin");
        const db = getAdminDb();
        const userDoc = await db.collection("users").doc(uid).get();
        isAdmin = userDoc.data()?.isAdmin === true;
        
        if (hasAdminClaim && !isAdmin) {
          SecurityLogger.logSecurityEvent({
            type: "suspicious_request",
            severity: "high",
            userId: uid,
            details: {
              reason: "stale_admin_claim_detected",
              message: "User has admin JWT claim but isAdmin is false in database"
            }
          });
        }
      } catch (dbError) {
        console.error("Error verifying admin status in middleware:", dbError);
        // Fail safe: if we can't verify, don't grant admin status
        isAdmin = false;
      }
    }

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
