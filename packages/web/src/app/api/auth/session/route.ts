import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import {
  clearSessionCookieInResponse,
  createSessionCookie,
  revokeSessionCookie,
  setSessionCookie,
} from "@/lib/auth/session";
import {
  ensureCsrfCookie,
  validateCsrf,
} from "@/lib/security/csrf";
import { 
  createAuthError, 
  createSuccessResponse,
} from "@/lib/api/errorResponse";
import { ERROR_CODES } from "@/lib/api/errorCodes";
import { withApi } from "@/lib/api/withApi";
import { z } from "zod";

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

export const GET = withApi({
  auth: "none",
  skipCsrf: true, // Skip CSRF validation for GET request that sets the CSRF token
}, async ({ request }) => {
  const response = createSuccessResponse({ ok: true }, "Session endpoint available");
  await ensureCsrfCookie(request, response);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  return response;
});

const sessionBodySchema = z.object({
  idToken: z.string().min(100, "Invalid ID token format"),
});

export const POST = withApi({
  auth: "none",
  rateLimit: "auth",
  bodySchema: sessionBodySchema,
  skipCsrf: true, // We validate CSRF manually below
}, async ({ request, body }) => {
  try {
    validateCsrf(request);
  } catch (csrfError) {
    console.error("CSRF validation failed:", csrfError);
    throw createAuthError(
      csrfError instanceof Error ? csrfError.message : "CSRF validation failed",
      ERROR_CODES.FORBIDDEN
    );
  }

  const { idToken } = body;

  // Verify the ID token
  const decoded = await verifyIdToken(idToken);
  
  if (!decoded) {
    throw createAuthError("Failed to verify ID token", ERROR_CODES.INVALID_TOKEN);
  }
  
  await validateUserSession(decoded);

  // Create session with enhanced security
  const { sessionCookie, expiresAt, sessionHash } = await createSessionCookie(idToken, {
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
      sessionHash,
      expiresAt,
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

export const DELETE = withApi({
  auth: "none",
  skipCsrf: true, // We validate CSRF manually below
}, async ({ request }) => {
  try {
    validateCsrf(request);
  } catch (csrfError) {
    console.error("CSRF validation failed on DELETE:", csrfError);
    throw createAuthError(
      csrfError instanceof Error ? csrfError.message : "CSRF validation failed",
      ERROR_CODES.FORBIDDEN
    );
  }

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
