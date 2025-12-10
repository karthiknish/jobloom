/**
 * Centralized authentication wrapper for API routes.
 * 
 * Usage:
 *   export const GET = withAuth(async (request, { user }) => {
 *     // user is already verified
 *     return NextResponse.json({ userId: user.uid });
 *   });
 * 
 *   // For admin-only routes:
 *   export const POST = withAdminAuth(async (request, { user }) => {
 *     // user is verified and is an admin
 *   });
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, isUserAdmin } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";
import type { DecodedIdToken } from "firebase-admin/auth";

// User context provided to authenticated handlers
export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
  isAdmin: boolean;
  emailVerified?: boolean;
}

// Context provided to route handlers
export interface AuthContext {
  user: AuthenticatedUser;
  token: string;
}

// Route params type for dynamic routes
export type RouteParams<T = Record<string, string>> = { params: Promise<T> };

// Handler function types
export type AuthenticatedHandler<P = Record<string, string>> = (
  request: NextRequest,
  context: AuthContext,
  params?: P
) => Promise<NextResponse> | NextResponse;

export type RouteHandler<P = Record<string, string>> = (
  request: NextRequest,
  routeContext?: RouteParams<P>
) => Promise<NextResponse> | NextResponse;

// Error response helpers
function unauthorizedResponse(message: string = "Unauthorized"): NextResponse {
  return NextResponse.json(
    { error: message, code: "UNAUTHORIZED" },
    { status: 401 }
  );
}

function forbiddenResponse(message: string = "Forbidden"): NextResponse {
  return NextResponse.json(
    { error: message, code: "FORBIDDEN" },
    { status: 403 }
  );
}

// Mock token detection for development/testing
function isMockToken(token: string): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    token.includes("bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc")
  );
}

function getMockUser(): AuthenticatedUser {
  return {
    uid: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    isAdmin: false,
    emailVerified: true,
  };
}

/**
 * Extract and verify authentication from request.
 * Checks session cookie first, then falls back to Bearer token.
 */
async function extractAuthFromRequest(
  request: NextRequest
): Promise<{ user: AuthenticatedUser; token: string } | null> {
  // Try session-based auth first
  try {
    const sessionClaims = await verifySessionFromRequest(request);
    if (sessionClaims) {
      return {
        user: {
          uid: sessionClaims.uid,
          email: sessionClaims.email,
          name: (sessionClaims as any).name,
          isAdmin: (sessionClaims as any).admin === true,
          emailVerified: sessionClaims.email_verified,
        },
        token: "session",
      };
    }
  } catch {
    // Session verification failed, try Bearer token
  }

  // Try Bearer token auth
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  // Handle mock token in development
  if (isMockToken(token)) {
    return { user: getMockUser(), token };
  }

  // Verify Firebase token
  const decodedToken = await verifyIdToken(token);
  if (!decodedToken) {
    return null;
  }

  return {
    user: {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      isAdmin: (decodedToken as any).admin === true,
      emailVerified: decodedToken.email_verified,
    },
    token,
  };
}

/**
 * Wraps a route handler with authentication.
 * The handler receives the authenticated user in the context.
 * 
 * @example
 * export const GET = withAuth(async (request, { user }) => {
 *   const jobs = await getJobsForUser(user.uid);
 *   return NextResponse.json({ jobs });
 * });
 */
export function withAuth<P extends Record<string, string> = Record<string, string>>(
  handler: AuthenticatedHandler<P>
): RouteHandler<P> {
  return async (request: NextRequest, routeContext?: RouteParams<P>) => {
    try {
      const auth = await extractAuthFromRequest(request);

      if (!auth) {
        return unauthorizedResponse("Missing or invalid authentication");
      }

      // Resolve params if present
      const params = routeContext?.params ? await routeContext.params : undefined;

      return handler(request, { user: auth.user, token: auth.token }, params as P);
    } catch (error) {
      console.error("Auth middleware error:", error);

      if (error instanceof Error) {
        // Handle specific Firebase auth errors
        if (error.message.includes("token") || error.message.includes("auth")) {
          return unauthorizedResponse("Authentication failed");
        }
      }

      return NextResponse.json(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  };
}

/**
 * Wraps a route handler with admin-only authentication.
 * Returns 403 if the authenticated user is not an admin.
 * 
 * @example
 * export const POST = withAdminAuth(async (request, { user }) => {
 *   await createSystemAnnouncement(request);
 *   return NextResponse.json({ success: true });
 * });
 */
export function withAdminAuth<P extends Record<string, string> = Record<string, string>>(
  handler: AuthenticatedHandler<P>
): RouteHandler<P> {
  return async (request: NextRequest, routeContext?: RouteParams<P>) => {
    try {
      const auth = await extractAuthFromRequest(request);

      if (!auth) {
        return unauthorizedResponse("Missing or invalid authentication");
      }

      // Check admin status
      let isAdmin = auth.user.isAdmin;
      
      // Double-check admin status from database if not already set
      if (!isAdmin && auth.user.uid) {
        try {
          isAdmin = await isUserAdmin(auth.user.uid);
          auth.user.isAdmin = isAdmin;
        } catch {
          // If admin check fails, proceed with token-based status
        }
      }

      if (!isAdmin) {
        return forbiddenResponse("Admin access required");
      }

      // Resolve params if present
      const params = routeContext?.params ? await routeContext.params : undefined;

      return handler(request, { user: auth.user, token: auth.token }, params as P);
    } catch (error) {
      console.error("Admin auth middleware error:", error);

      if (error instanceof Error) {
        if (error.message.includes("token") || error.message.includes("auth")) {
          return unauthorizedResponse("Authentication failed");
        }
      }

      return NextResponse.json(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  };
}

/**
 * Optional authentication wrapper.
 * Provides user context if authenticated, null otherwise.
 * Useful for routes that have different behavior for authenticated vs anonymous users.
 * 
 * @example
 * export const GET = withOptionalAuth(async (request, { user }) => {
 *   if (user) {
 *     return NextResponse.json({ personalData: await getPersonalData(user.uid) });
 *   }
 *   return NextResponse.json({ publicData: await getPublicData() });
 * });
 */
export function withOptionalAuth<P extends Record<string, string> = Record<string, string>>(
  handler: (
    request: NextRequest,
    context: { user: AuthenticatedUser | null; token: string | null },
    params?: P
  ) => Promise<NextResponse> | NextResponse
): RouteHandler<P> {
  return async (request: NextRequest, routeContext?: RouteParams<P>) => {
    try {
      const auth = await extractAuthFromRequest(request);

      // Resolve params if present
      const params = routeContext?.params ? await routeContext.params : undefined;

      return handler(
        request,
        { user: auth?.user ?? null, token: auth?.token ?? null },
        params as P
      );
    } catch (error) {
      console.error("Optional auth middleware error:", error);

      return NextResponse.json(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  };
}
