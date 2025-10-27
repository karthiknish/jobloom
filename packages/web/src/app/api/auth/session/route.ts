import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import {
  clearSessionCookieInResponse,
  createSessionCookie,
  revokeSessionCookie,
  setSessionCookie,
} from "@/lib/auth/session";
import {
  CSRF_HEADER_NAME,
  ensureCsrfCookie,
  validateCsrf,
} from "@/lib/security/csrf";
import { 
  createValidationError, 
  createAuthError, 
  createSuccessResponse,
  withErrorHandler 
} from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";
import { checkServerRateLimit } from "@/lib/rateLimiter";

// Enhanced rate limiting for auth endpoints
async function applyAuthRateLimit(request: NextRequest): Promise<void> {
  const identifier = getClientIp(request);
  const result = checkServerRateLimit(identifier, 'auth', {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });
  
  if (!result.allowed) {
    const error = new Error("Too many sign-in attempts. Please try again later.");
    (error as any).statusCode = 429;
    (error as any).retryAfter = result.retryAfter;
    throw error;
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

function validateIdToken(idToken: string): void {
  if (typeof idToken !== "string" || !idToken) {
    throw createValidationError(
      "ID token is required and must be a string",
      "idToken"
    );
  }

  if (idToken.length < 100) {
    throw createValidationError(
      "Invalid ID token format",
      "idToken"
    );
  }
}

async function validateUserSession(decoded: any): Promise<void> {
  if (!decoded?.uid) {
    throw createAuthError("Invalid authentication token", ERROR_CODES.INVALID_TOKEN);
  }

  if (!decoded?.email) {
    throw createAuthError("Email verification required", ERROR_CODES.EMAIL_NOT_VERIFIED);
  }

  if (decoded.email_verified === false) {
    throw createAuthError("Please verify your email before signing in", ERROR_CODES.EMAIL_NOT_VERIFIED);
  }

  // Check if account is disabled
  if (decoded.disabled === true) {
    throw createAuthError("Account has been disabled", ERROR_CODES.ACCOUNT_DISABLED);
  }
}

export async function GET(request: NextRequest) {
  const response = createSuccessResponse({ ok: true }, "Session endpoint available");
  await ensureCsrfCookie(request, response);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Apply rate limiting
  await applyAuthRateLimit(request);

  validateCsrf(request);

  const body = await request.json();
  const { idToken } = body;
  
  validateIdToken(idToken);

  // Verify the ID token
  const decoded = await verifyIdToken(idToken);
  await validateUserSession(decoded);

  // Create session with enhanced security
  const { sessionCookie, expiresAt } = await createSessionCookie(idToken, {
    userAgent: request.headers.get("user-agent"),
    ip: getClientIp(request),
  });

  const response = createSuccessResponse(
    { 
      ok: true, 
      uid: decoded?.uid,
      email: decoded?.email,
      emailVerified: decoded?.email_verified,
      isNewUser: false,
    },
    "Session established successfully"
  );

  setSessionCookie(response, sessionCookie, expiresAt);
  
  // Enhanced security headers
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  validateCsrf(request);

  const response = createSuccessResponse({ ok: true }, "Session revoked successfully");
  
  await revokeSessionCookie(request, response);
  clearSessionCookieInResponse(response);
  
  // Enhanced security headers for logout
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Clear-Site-Data", "\"cache\", \"cookies\", \"storage\"");
  
  return response;
});
