import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
// Use Web Crypto API for edge runtime compatibility
function randomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
import { getAdminApp, getAdminDb, getAdminAuth } from "@/firebase/admin";
import { hashSessionToken } from "@/lib/security/csrf";
import { SecurityLogger } from "@/utils/security";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export const SESSION_COOKIE_NAME = "__session";
const SESSION_COLLECTION = "userSessions";
const SESSION_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

type SessionMetadata = {
  userAgent?: string | null;
  ip?: string | null;
};

type SessionVerificationContext = {
  ip?: string;
};

type HeaderGetter = {
  get(name: string): string | null | undefined;
};

function getClientIpFromHeaderLike(headers?: HeaderGetter | null): string | undefined {
  if (!headers) {
    return undefined;
  }

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp;
  }

  return undefined;
}

async function verifySessionCookieValue(
  sessionCookie: string,
  context: SessionVerificationContext = {},
) {
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const hash = await hashSessionToken(sessionCookie);
    const db = getAdminDb();
    const doc = await db
      .collection(SESSION_COLLECTION)
      .doc(decoded.uid)
      .collection("sessions")
      .doc(hash)
      .get();

    if (!doc.exists) {
      SecurityLogger.logSecurityEvent({
        type: "suspicious_request",
        severity: "medium",
        details: {
          reason: "Session cookie not found in store",
        },
        userId: decoded.uid,
        ip: context.ip ?? "unknown",
      });
      return null;
    }

    await doc.ref.update({ lastSeenAt: new Date().toISOString() });

    return decoded;
  } catch (error) {
    SecurityLogger.logSecurityEvent({
      type: "auth_failure",
      severity: "medium",
      details: {
        reason: "Session verification failed",
        error: error instanceof Error ? error.message : "unknown",
      },
      ip: context.ip ?? "unknown",
    });
    return null;
  }
}

export async function createSessionCookie(
  idToken: string,
  metadata: SessionMetadata,
): Promise<{ sessionCookie: string; expiresAt: number; sessionHash: string }> {
  const auth = getAdminAuth();
  const expiresAt = Date.now() + SESSION_EXPIRY_SECONDS * 1000;
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRY_SECONDS * 1000,
  });

  const decoded = await auth.verifySessionCookie(sessionCookie, true);
  
  // SESSION FIXATION PROTECTION:
  // Revoke existing refresh tokens and session cookies for this user 
  // before establishing the new session.
  try {
    await auth.revokeRefreshTokens(decoded.uid);
  } catch (err) {
    console.warn("Failed to revoke previous tokens during session creation:", err);
  }

  const hash = await hashSessionToken(sessionCookie);
  const db = getAdminDb();
  const sessionDoc = db
    .collection(SESSION_COLLECTION)
    .doc(decoded.uid)
    .collection("sessions")
    .doc(hash);

  await sessionDoc.set(
    {
      createdAt: new Date().toISOString(),
      expiresAt,
      lastSeenAt: new Date().toISOString(),
      userAgent: metadata.userAgent ?? "unknown",
      ip: metadata.ip ?? "unknown",
    },
    { merge: true },
  );

  return { sessionCookie, expiresAt, sessionHash: hash };
}

export async function verifySessionHashForUser(
  uid: string,
  sessionHash: string,
): Promise<boolean> {
  if (!sessionHash || sessionHash.length < 8) {
    return false;
  }

  try {
    const db = getAdminDb();
    const doc = await db
      .collection(SESSION_COLLECTION)
      .doc(uid)
      .collection("sessions")
      .doc(sessionHash)
      .get();

    if (!doc.exists) {
      return false;
    }

    await doc.ref.update({ lastSeenAt: new Date().toISOString() });
    return true;
  } catch (error) {
    SecurityLogger.logSecurityEvent({
      type: "auth_failure",
      severity: "medium",
      details: {
        reason: "Session hash verification failed",
        error: error instanceof Error ? error.message : "unknown",
      },
    });
    return false;
  }
}

export async function verifySessionFromRequest(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) {
    const session = await verifySessionCookieValue(sessionCookie, { ip: getClientIp(request) });
    if (session) {
      return session;
    }
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        // Basic token validation before attempting verification
        if (token.length < 100) {
          SecurityLogger.logSecurityEvent({
            type: "suspicious_request",
            severity: "low",
            details: {
              reason: "Token too short to be valid",
              tokenLength: token.length
            },
            ip: getClientIp(request),
          });
          return null;
        }

        // Verify the token
        const auth = getAdminAuth();
        const decoded = await auth.verifyIdToken(token);
        
        // Log successful authentication for audit (in development only)
        if (decoded && process.env.NODE_ENV === 'development') {
          console.log('[AUTH] Successfully authenticated user:', decoded.uid);
        }
        
        return decoded;
      } catch (error: any) {
        // Categorize the error for better handling
        let severity: "low" | "medium" | "high" = "medium";
        let errorReason = "unknown";
        
        if (error?.code) {
          switch (error.code) {
            case 'auth/id-token-expired':
              errorReason = "Token expired";
              severity = "low"; // Expected behavior
              break;
            case 'auth/id-token-revoked':
              errorReason = "Token revoked";
              severity = "high"; // Potential security issue
              break;
            case 'auth/invalid-id-token':
              errorReason = "Invalid token format";
              severity = "medium";
              break;
            case 'auth/argument-error':
              errorReason = "Malformed token";
              severity = "medium";
              break;
            default:
              errorReason = error.code;
          }
        }
        
        SecurityLogger.logSecurityEvent({
          type: "auth_failure",
          severity,
          details: {
            reason: errorReason,
            errorCode: error?.code,
            error: error instanceof Error ? error.message : "unknown",
          },
          ip: getClientIp(request),
        });
      }
    }
  }

  return null;
}

export async function verifySessionFromCookies(options: {
  headers?: HeaderGetter | null;
} = {}) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) {
      return null;
    }

    const ip = getClientIpFromHeaderLike(options.headers ?? null);
    return verifySessionCookieValue(sessionCookie, { ip });
  } catch {
    return null;
  }
}

export async function revokeSessionCookie(
  request: NextRequest,
  response: NextResponse,
) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    response.cookies.delete(SESSION_COOKIE_NAME);
    return;
  }

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const hash = await hashSessionToken(sessionCookie);
    const db = getAdminDb();
    await db
      .collection(SESSION_COLLECTION)
      .doc(decoded.uid)
      .collection("sessions")
      .doc(hash)
      .delete();

    response.cookies.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    response.cookies.delete(SESSION_COOKIE_NAME);
    SecurityLogger.logSecurityEvent({
      type: "auth_failure",
      severity: "medium",
      details: {
        reason: "Failed to revoke session",
        error: error instanceof Error ? error.message : "unknown",
      },
      ip: getClientIp(request),
    });
  }
}

export function setSessionCookie(
  response: NextResponse,
  cookieValue: string,
  expiresAt: number,
): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    path: "/",
    maxAge: Math.floor((expiresAt - Date.now()) / 1000),
  });
}

export function clearSessionCookieInResponse(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionCookieValue(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE_NAME)?.value;
  } catch {
    return undefined;
  }
}
