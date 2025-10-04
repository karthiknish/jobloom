import { NextRequest, NextResponse } from "next/server";
import {
  checkServerRateLimitWithAuth,
  cleanupExpiredServerLimits,
  getEndpointFromPath,
} from "@/lib/rateLimiter";
import { ensureCsrfCookie, validateCsrf } from "@/lib/security/csrf";
import { SecurityLogger } from "@/utils/security";
import { generateRequestId } from "@/lib/api/errors";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Download-Options": "noopen",
  "X-Permitted-Cross-Domain-Policies": "none",
  "X-DNS-Prefetch-Control": "off",
};

const CONTENT_SECURITY_POLICY = [
  "default-src 'self';",
  "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com;",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
  "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com;",
  "font-src 'self' https://fonts.gstatic.com;",
  "connect-src 'self' https://firebasestorage.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.google-analytics.com https://www.googletagmanager.com;",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com;",
  "frame-ancestors 'none';",
  "worker-src 'self' blob:;",
  "manifest-src 'self';",
].join(" ");

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.ip ||
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

export async function middleware(request: NextRequest) {
  const requestId = generateRequestId();

  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
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

      return NextResponse.json(
        {
          error: "Request blocked due to invalid CSRF token",
          requestId,
        },
        { status: 403 },
      );
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

      return NextResponse.json(
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
    }
  }

  const response = NextResponse.next();
  ensureCsrfCookie(request, response);
  applySecurityHeaders(response, requestId);
  cleanupExpiredServerLimits();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

