import { NextRequest, NextResponse } from "next/server";
import {
  checkServerRateLimitWithAuth,
  cleanupExpiredServerLimits,
  getEndpointFromPath,
} from "@/lib/rateLimiter";
import { ensureCsrfCookie, validateCsrf, hashSessionToken } from "@/lib/security/csrf";
import { SecurityLogger } from "@/utils/security";
import { generateRequestId } from "@/lib/api/errors";


const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "unsafe-none",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Download-Options": "noopen",
  "X-Permitted-Cross-Domain-Policies": "none",
  "X-DNS-Prefetch-Control": "off",
};

const CUSTOM_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_CUSTOM_AUTH_DOMAIN;
const CUSTOM_AUTH_ORIGIN = CUSTOM_AUTH_DOMAIN
  ? CUSTOM_AUTH_DOMAIN.startsWith("http")
    ? CUSTOM_AUTH_DOMAIN
    : `https://${CUSTOM_AUTH_DOMAIN}`
  : undefined;

const CONTENT_SECURITY_POLICY = (() => {
  const connectSrc = [
    "'self'",
    "https://firebasestorage.googleapis.com",
    "https://firestore.googleapis.com",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://www.google-analytics.com",
    "https://www.googletagmanager.com",
    "https://*.googleapis.com",
  ];

  if (CUSTOM_AUTH_ORIGIN && !connectSrc.includes(CUSTOM_AUTH_ORIGIN)) {
    connectSrc.push(CUSTOM_AUTH_ORIGIN);
  }

  const frameSrc = [
    "'self'",
    "https://js.stripe.com",
    "https://hooks.stripe.com",
    "https://auth.hireall.app",
    "https://*.firebase.com",
    "https://*.hireall.app",
  ];

  if (CUSTOM_AUTH_ORIGIN && !frameSrc.includes(CUSTOM_AUTH_ORIGIN)) {
    frameSrc.push(CUSTOM_AUTH_ORIGIN);
  }

  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://*.googleusercontent.com",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src ${frameSrc.join(" ")}`,
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ];

  return directives.map((directive) => `${directive};`).join(" ");
})();

const SESSION_COOKIE_NAME = "__session";

const AUTH_PATH_PREFIXES = [
  "/dashboard",
  "/application",
  "/resume-builder",
  "/settings",
  "/cv-evaluator",
  "/welcome",
  "/test-auth",
];

const ADMIN_PATH_PREFIXES = ["/admin"];

const FIREBASE_JWK_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

const INTERNAL_API_SECRET =
  process.env.INTERNAL_API_SECRET ??
  (process.env.NODE_ENV === "development" ? "dev-internal-secret" : undefined);
const ADMIN_STATUS_CACHE_TTL = 5 * 60 * 1000;

type FirebasePublicKeyCache = {
  keys: Map<string, CryptoKey>;
  expiresAt: number;
};

type CachedSessionClaims = {
  claims: VerifiedSessionClaims;
  expiresAt: number;
};

interface VerifiedSessionClaims {
  uid: string;
  email?: string;
  isAdmin: boolean;
  expiresAt: number;
  raw: Record<string, unknown>;
}

let firebasePublicKeyCache: FirebasePublicKeyCache | null = null;
let firebasePublicKeyFetch: Promise<FirebasePublicKeyCache | null> | null = null;
const sessionVerificationCache = new Map<string, CachedSessionClaims>();
const adminStatusCache = new Map<string, { value: boolean; expiresAt: number }>();

async function logSessionVerificationFailure(
  token: string,
  reason: string,
  extra?: Record<string, unknown>,
): Promise<void> {
  try {
    const tokenHash = await hashSessionToken(token);
    SecurityLogger.logSecurityEvent({
      type: "auth_failure",
      severity: "medium",
      details: {
        reason: `session_verify_${reason}`,
        tokenHash,
        ...extra,
      },
    });
  } catch (error) {
    SecurityLogger.logSecurityEvent({
      type: "auth_failure",
      severity: "medium",
      details: {
        reason: `session_verify_${reason}_log_failed`,
        logError: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

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

function applySecurityHeaders(response: NextResponse, requestId: string) {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  response.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  response.headers.set("X-Request-ID", requestId);

  if (process.env.NODE_ENV !== "development") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
}

function matchesPath(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function requiresAuthentication(pathname: string): boolean {
  return matchesPath(pathname, AUTH_PATH_PREFIXES);
}

function requiresAdminAccess(pathname: string): boolean {
  return matchesPath(pathname, ADMIN_PATH_PREFIXES);
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function decodeBase64UrlString(base64Url: string): string {
  const bytes = base64UrlToUint8Array(base64Url);
  return new TextDecoder().decode(bytes);
}

function parseMaxAge(cacheControl: string | null): number | null {
  if (!cacheControl) {
    return null;
  }

  const match = cacheControl.match(/max-age=(\d+)/);
  if (!match) {
    return null;
  }

  const value = Number.parseInt(match[1] ?? "", 10);
  return Number.isNaN(value) ? null : value;
}

async function fetchFirebasePublicKeys(): Promise<FirebasePublicKeyCache | null> {
  if (!firebasePublicKeyFetch) {
    firebasePublicKeyFetch = (async () => {
      try {
        const response = await fetch(FIREBASE_JWK_URL);

        if (!response.ok) {
          SecurityLogger.logSecurityEvent({
            type: "auth_failure",
            severity: "medium",
            details: {
              reason: "failed_public_key_fetch_response",
              status: response.status,
            },
          });
          return null;
        }

        const body = (await response.json()) as {
          keys?: Array<JsonWebKey & { kid?: string }>;
        };
        const jwks = Array.isArray(body?.keys) ? body.keys : [];
        const importedKeys = new Map<string, CryptoKey>();

        await Promise.all(
          jwks.map(async (jwk) => {
            if (!jwk || typeof jwk !== "object" || typeof jwk.kid !== "string") {
              return;
            }

            try {
              const cryptoKey = await crypto.subtle.importKey(
                "jwk",
                jwk,
                {
                  name: "RSASSA-PKCS1-v1_5",
                  hash: "SHA-256",
                },
                false,
                ["verify"],
              );
              importedKeys.set(jwk.kid, cryptoKey);
            } catch (importError) {
              SecurityLogger.logSecurityEvent({
                type: "auth_failure",
                severity: "medium",
                details: {
                  reason: "public_key_import_failed",
                  error:
                    importError instanceof Error
                      ? importError.message
                      : String(importError),
                  kid: jwk.kid,
                },
              });
            }
          }),
        );

        if (importedKeys.size === 0) {
          SecurityLogger.logSecurityEvent({
            type: "auth_failure",
            severity: "medium",
            details: {
              reason: "public_key_import_empty",
            },
          });
          return null;
        }

        const cacheControl = response.headers.get("cache-control");
        const maxAge = parseMaxAge(cacheControl) ?? 300;
        const cache: FirebasePublicKeyCache = {
          keys: importedKeys,
          expiresAt: Date.now() + maxAge * 1000,
        };
        firebasePublicKeyCache = cache;
        return cache;
      } catch (error) {
        SecurityLogger.logSecurityEvent({
          type: "auth_failure",
          severity: "medium",
          details: {
            reason: "failed_public_key_fetch",
            error: error instanceof Error ? error.message : String(error),
          },
        });
        return null;
      } finally {
        firebasePublicKeyFetch = null;
      }
    })();
  }

  const cache = await firebasePublicKeyFetch;
  if (!cache) {
    firebasePublicKeyCache = null;
  }
  return cache;
}

async function getFirebasePublicKey(kid: string): Promise<CryptoKey | undefined> {
  const now = Date.now();
  if (firebasePublicKeyCache && firebasePublicKeyCache.expiresAt > now) {
    return firebasePublicKeyCache.keys.get(kid);
  }

  const cache = await fetchFirebasePublicKeys();
  return cache?.keys.get(kid);
}

async function getCachedSessionClaims(token: string): Promise<VerifiedSessionClaims | null> {
  const cacheKey = await hashSessionToken(token);
  const cached = sessionVerificationCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    sessionVerificationCache.delete(cacheKey);
    return null;
  }

  return cached.claims;
}

async function cacheSessionClaims(token: string, claims: VerifiedSessionClaims): Promise<void> {
  const cacheKey = await hashSessionToken(token);
  sessionVerificationCache.set(cacheKey, {
    claims,
    expiresAt: claims.expiresAt,
  });
}

// Import Firebase Admin for session verification
// Note: This would require server-side Firebase Admin SDK to be available
// For now, we'll implement a fallback that checks if session exists in our session store

async function verifySessionCookieToken(token: string): Promise<VerifiedSessionClaims | null> {
  const cached = await getCachedSessionClaims(token);
  if (cached) {
    return cached;
  }

  try {
    // Simple JWT parsing for session verification - this is a basic implementation
    // In a production environment, you'd want to verify the signature with Firebase Admin SDK
    const parts = token.split(".");
    if (parts.length !== 3) {
      await logSessionVerificationFailure(token, "invalid_token_parts", {
        partsCount: parts.length,
      });
      return null;
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(decodeBase64UrlString(parts[1]!));
    } catch {
      await logSessionVerificationFailure(token, "invalid_token_json");
      return null;
    }

    // Check expiration
    const nowSeconds = Math.floor(Date.now() / 1000);
    const exp = typeof payload.exp === "number" ? payload.exp : undefined;

    if (exp !== undefined && exp <= nowSeconds) {
      await logSessionVerificationFailure(token, "token_expired", {
        exp,
        nowSeconds,
      });
      return null;
    }

    // Extract basic user info
    const uid =
      (typeof payload.user_id === "string" && payload.user_id) ||
      (typeof payload.sub === "string" && payload.sub) ||
      (typeof payload.uid === "string" && payload.uid) ||
      undefined;

    if (!uid) {
      await logSessionVerificationFailure(token, "missing_uid", {
        hasUserId: typeof payload.user_id === "string",
        hasSub: typeof payload.sub === "string",
        hasUid: typeof payload.uid === "string",
      });
      return null;
    }

    const email = typeof payload.email === "string" ? payload.email : undefined;
    const expiresAt = exp ? exp * 1000 : Date.now() + 5 * 60 * 1000;

    // For now, don't assume admin status from session cookie
    // Let the admin status be checked separately via API
    const isAdmin = false;

    const claims: VerifiedSessionClaims = {
      uid,
      email,
      isAdmin,
      expiresAt,
      raw: payload,
    };

    await cacheSessionClaims(token, claims);
    return claims;
  } catch (error) {
    await logSessionVerificationFailure(token, "verification_error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function createSignInRedirect(request: NextRequest): NextResponse {
  const signInUrl = new URL("/sign-in", request.url);
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  signInUrl.searchParams.set("redirect_url", returnTo);
  return NextResponse.redirect(signInUrl);
}

function createAdminRedirect(request: NextRequest): NextResponse {
  const target = new URL("/welcome", request.url);
  target.searchParams.set("admin", "required");
  return NextResponse.redirect(target);
}

async function resolveAdminStatus(
  uid: string,
  request: NextRequest,
): Promise<boolean | null> {
  const cached = adminStatusCache.get(uid);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  if (!INTERNAL_API_SECRET) {
    SecurityLogger.logSecurityEvent({
      type: "auth_failure",
      severity: "medium",
      details: {
        reason: "internal_admin_secret_missing",
      },
      userId: uid,
      ip: getClientIp(request),
    });
    return null;
  }

  try {
    const adminUrl = new URL(`/api/internal/admin-status/${uid}`, request.nextUrl);
    const response = await fetch(adminUrl.toString(), {
      headers: {
        "x-internal-secret": INTERNAL_API_SECRET,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      SecurityLogger.logSecurityEvent({
        type: "auth_failure",
        severity: "medium",
        userId: uid,
        ip: getClientIp(request),
        details: {
          reason: "admin_status_fetch_failed",
          status: response.status,
        },
      });
      return null;
    }

    const data = (await response.json()) as { isAdmin?: unknown };
    const isAdmin = data.isAdmin === true;
    adminStatusCache.set(uid, {
      value: isAdmin,
      expiresAt: now + ADMIN_STATUS_CACHE_TTL,
    });
    return isAdmin;
  } catch (error) {
    SecurityLogger.logSecurityEvent({
      type: "auth_failure",
      severity: "medium",
      userId: uid,
      ip: getClientIp(request),
      details: {
        reason: "admin_status_fetch_error",
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return null;
  }
}

async function enforceRouteSecurity(
  request: NextRequest,
): Promise<{ session: VerifiedSessionClaims | null; redirect?: NextResponse }> {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/")) {
    return { session: null };
  }

  const needsAdmin = requiresAdminAccess(pathname);
  const needsAuth = needsAdmin || requiresAuthentication(pathname);

  if (!needsAuth) {
    return { session: null };
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    SecurityLogger.logSecurityEvent({
      type: needsAdmin ? "admin_access_denied" : "auth_required",
      severity: needsAdmin ? "medium" : "low",
      ip: getClientIp(request),
      details: {
        path: pathname,
        reason: "session_cookie_missing",
      },
    });
    const redirect = createSignInRedirect(request);
    redirect.cookies.delete(SESSION_COOKIE_NAME);
    return { session: null, redirect };
  }

  const sessionClaims = await verifySessionCookieToken(sessionCookie);
  if (!sessionClaims) {
    SecurityLogger.logSecurityEvent({
      type: "auth_failure",
      severity: "medium",
      ip: getClientIp(request),
      details: {
        path: pathname,
        reason: "session_verification_failed",
      },
    });
    const redirect = createSignInRedirect(request);
    redirect.cookies.delete(SESSION_COOKIE_NAME);
    return { session: null, redirect };
  }

  if (needsAdmin && !sessionClaims.isAdmin) {
    const adminStatus = await resolveAdminStatus(sessionClaims.uid, request);
    if (adminStatus) {
      sessionClaims.isAdmin = true;
      if (sessionCookie) {
        await cacheSessionClaims(sessionCookie, sessionClaims);
      }
    } else {
      SecurityLogger.logSecurityEvent({
        type: "admin_access_denied",
        severity: "medium",
        ip: getClientIp(request),
        userId: sessionClaims.uid,
        details: {
          path: pathname,
          reason: adminStatus === false ? "user_not_admin" : "admin_status_unverified",
        },
      });
      const redirect = createAdminRedirect(request);
      return { session: null, redirect };
    }
  }

  return { session: sessionClaims };
}

async function finalizeResponse(
  request: NextRequest,
  response: NextResponse,
  requestId: string,
): Promise<NextResponse> {
  await ensureCsrfCookie(request, response);
  applySecurityHeaders(response, requestId);
  cleanupExpiredServerLimits();
  return response;
}

export async function middleware(request: NextRequest) {
  const requestId = generateRequestId();

  // Skip CSRF validation for Stripe webhooks (they come from external service)
  // and for API routes in development mode (for testing)
  const isWebhook = request.nextUrl.pathname === "/api/stripe/webhook";
  const isApiRouteInDev = request.nextUrl.pathname.startsWith("/api/") && process.env.NODE_ENV === "development";

  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && !isWebhook && !isApiRouteInDev) {
    try {
      validateCsrf(request);
    } catch (error) {
      SecurityLogger.logSecurityEvent({
        type: "suspicious_request",
        severity: "high",
        ip: getClientIp(request),
        details: {
          reason: "CSRF validation failed",
          error: error instanceof Error ? error.message : "invalid_csrf",
          path: request.nextUrl.pathname,
        },
      });
      const response = NextResponse.json(
        {
          error: "Request blocked due to invalid CSRF token",
          requestId,
        },
        { status: 403 },
      );
      return finalizeResponse(request, response, requestId);
    }
  }

  let sessionClaims: VerifiedSessionClaims | null = null;

  if (!request.nextUrl.pathname.startsWith("/api/")) {
    const securityResult = await enforceRouteSecurity(request);
    if (securityResult.redirect) {
      return finalizeResponse(request, securityResult.redirect, requestId);
    }
    sessionClaims = securityResult.session;
  }

  if (sessionClaims) {
    const pathname = request.nextUrl.pathname;
    if (pathname === "/sign-in") {
      const redirectParam = request.nextUrl.searchParams.get("redirect_url");
      const isSafeRedirect =
        typeof redirectParam === "string" &&
        redirectParam.startsWith("/") &&
        !redirectParam.startsWith("//");
      const targetPath = isSafeRedirect ? redirectParam : "/dashboard";
      const redirectUrl = new URL(targetPath, request.url);
      const redirectResponse = NextResponse.redirect(redirectUrl);
      return finalizeResponse(request, redirectResponse, requestId);
    }
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const identifier = getClientIp(request);
    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");
    const authToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : undefined;
    const endpoint = getEndpointFromPath(request.nextUrl.pathname);

    const rateCheck = await checkServerRateLimitWithAuth(
      identifier,
      endpoint,
      authToken,
    );

    if (!rateCheck.allowed) {
      SecurityLogger.logSecurityEvent({
        type: "rate_limit_exceeded",
        severity: "medium",
        ip: identifier,
        details: {
          endpoint,
          retryAfter: rateCheck.retryAfter,
          remaining: rateCheck.remaining,
        },
      });
      const response = NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          endpoint,
          requestId,
        },
        {
          status: 429,
          headers: {
            "Retry-After": (rateCheck.retryAfter || 0).toString(),
            "X-Rate-Limit-Limit": (rateCheck.maxRequests || 0).toString(),
            "X-Rate-Limit-Remaining": (rateCheck.remaining || 0).toString(),
            "X-Rate-Limit-Reset": (rateCheck.resetIn || 0).toString(),
            "X-Rate-Limit-Identifier": rateCheck.identifier || identifier,
            "X-Request-ID": requestId,
          },
        },
      );
      return finalizeResponse(request, response, requestId);
    }
  }

  let response: NextResponse;

  if (sessionClaims) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-hireall-user-id", sessionClaims.uid);
    if (sessionClaims.email) {
      requestHeaders.set("x-hireall-user-email", sessionClaims.email);
    }
    requestHeaders.set(
      "x-hireall-user-role",
      sessionClaims.isAdmin ? "admin" : "user",
    );

    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } else {
    response = NextResponse.next();
  }

  return finalizeResponse(request, response, requestId);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/internal/).*)",
  ],
};

