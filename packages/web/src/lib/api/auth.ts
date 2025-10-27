import { NextResponse, type NextRequest } from "next/server";
import { verifySessionFromRequest } from "@/lib/auth/session";
import { getAdminDb } from "@/firebase/admin";

type AuthOptions = {
  requireAdmin?: boolean;
  requireAuthHeader?: boolean;
  loadUser?: boolean;
  cacheTtlMs?: number;
};

type CachedUser = {
  data: Record<string, any> | null;
  expiresAt: number;
};

type AuthSuccess = {
  ok: true;
  token: import("firebase-admin/auth").DecodedIdToken;
  user: Record<string, any> | null;
  isAdmin: boolean;
};

type AuthFailure = {
  ok: false;
  response: NextResponse;
};

const userCache = new Map<string, CachedUser>();
const DEFAULT_CACHE_TTL_MS = 60_000;

async function getUserWithCache(uid: string, ttlMs: number): Promise<Record<string, any> | null> {
  const cached = userCache.get(uid);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const snapshot = await getAdminDb().collection("users").doc(uid).get();
  const data = snapshot.exists ? snapshot.data() ?? null : null;
  userCache.set(uid, {
    data,
    expiresAt: Date.now() + ttlMs,
  });

  return data;
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
  } = options;

  const authHeader = request.headers.get("authorization");

  if (requireAuthHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }
  }

  const decodedToken = await verifySessionFromRequest(request);

  if (!decodedToken) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
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
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    token: decodedToken as any,
    user,
    isAdmin,
  };
}

export function clearUserAuthCache(uid?: string): void {
  if (uid) {
    userCache.delete(uid);
    return;
  }
  userCache.clear();
}
