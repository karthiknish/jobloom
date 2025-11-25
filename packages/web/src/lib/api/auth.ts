import { NextResponse, type NextRequest } from "next/server";
import { verifySessionFromRequest } from "@/lib/auth/session";
import { getAdminDb } from "@/firebase/admin";
import { applyCorsHeaders, isExtensionRequest } from "@/lib/api/cors";
import { 
  userCache, 
  cleanupCache, 
  DEFAULT_CACHE_TTL_MS, 
  MAX_CACHE_SIZE 
} from "./auth-cache";

export { clearUserAuthCache, getAuthCacheStats } from "./auth-cache";

type AuthOptions = {
  requireAdmin?: boolean;
  requireAuthHeader?: boolean;
  loadUser?: boolean;
  cacheTtlMs?: number;
  /** Allow unauthenticated access but still try to get user if available */
  optionalAuth?: boolean;
};

type AuthSuccess = {
  ok: true;
  token: import("firebase-admin/auth").DecodedIdToken;
  user: Record<string, any> | null;
  isAdmin: boolean;
  isExtension: boolean;
};

type AuthFailure = {
  ok: false;
  response: NextResponse;
  code: string;
};

async function getUserWithCache(uid: string, ttlMs: number): Promise<Record<string, any> | null> {
  const cached = userCache.get(uid);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const snapshot = await getAdminDb().collection("users").doc(uid).get();
    const data = snapshot.exists ? snapshot.data() ?? null : null;
    
    userCache.set(uid, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
    
    // Cleanup cache periodically
    if (userCache.size > MAX_CACHE_SIZE * 0.9) {
      cleanupCache();
    }

    return data;
  } catch (error) {
    console.error('Error fetching user from Firestore:', error);
    // Return cached data if available, even if expired
    if (cached) {
      return cached.data;
    }
    return null;
  }
}

export async function authenticateRequest(
  request: NextRequest,
  options: AuthOptions = {}
): Promise<AuthSuccess | AuthFailure> {
  const {
    requireAdmin = false,
    requireAuthHeader = false,
    loadUser = false,
    cacheTtlMs = DEFAULT_CACHE_TTL_MS,
    optionalAuth = false,
  } = options;

  const authHeader = request.headers.get("authorization");
  const isFromExtension = isExtensionRequest(request);

  // For extension requests, always require auth header
  const effectiveRequireAuthHeader = requireAuthHeader || isFromExtension;

  if (effectiveRequireAuthHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const response = NextResponse.json({ 
        error: "Unauthorized", 
        code: "MISSING_AUTH_HEADER",
        message: "Authorization header with Bearer token is required"
      }, { status: 401 });
      
      return {
        ok: false,
        response: applyCorsHeaders(response, request),
        code: "MISSING_AUTH_HEADER",
      };
    }
  }

  const decodedToken = await verifySessionFromRequest(request);

  if (!decodedToken) {
    // If auth is optional, return a "success" with no user
    if (optionalAuth) {
      return {
        ok: true,
        token: null as any,
        user: null,
        isAdmin: false,
        isExtension: isFromExtension,
      };
    }
    
    const response = NextResponse.json({ 
      error: "Invalid or expired token", 
      code: "INVALID_TOKEN",
      message: "Please sign in again to continue"
    }, { status: 401 });
    
    return {
      ok: false,
      response: applyCorsHeaders(response, request),
      code: "INVALID_TOKEN",
    };
  }

  const shouldLoadUser = requireAdmin || loadUser;
  let user: Record<string, any> | null = null;
  let isAdmin = false;

  if (shouldLoadUser) {
    user = await getUserWithCache(decodedToken.uid, cacheTtlMs);
    isAdmin = user?.isAdmin === true;
  }

  if (requireAdmin && !isAdmin) {
    const response = NextResponse.json({ 
      error: "Admin access required", 
      code: "ADMIN_REQUIRED",
      message: "You do not have permission to access this resource"
    }, { status: 403 });
    
    return {
      ok: false,
      response: applyCorsHeaders(response, request),
      code: "ADMIN_REQUIRED",
    };
  }

  return {
    ok: true,
    token: decodedToken as any,
    user,
    isAdmin,
    isExtension: isFromExtension,
  };
}
