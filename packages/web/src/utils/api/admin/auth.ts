import { getAuthClient } from "@/firebase/client";
import { apiClient } from "@/lib/api/client";

// Cache for admin verification to prevent duplicate calls
let adminVerificationCache: {
  user: any;
  timestamp: number;
  uid: string;
} | null = null;

// In-flight de-dupe must be per-user and must be set BEFORE awaiting any async work.
const adminVerificationInFlightByUid = new Map<string, Promise<any>>();

let adminVerificationFailureCache: {
  timestamp: number;
  uid: string;
  status?: number;
  retryAfterSeconds?: number;
} | null = null;

const SUCCESS_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const FAILURE_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes (base; 429 uses server retryAfter when available)

type PersistedAdminCache = {
  uid: string;
  timestamp: number;
  user: any;
};

const adminCacheKey = (uid: string) => `hireall:admin-verify-cache:${uid}`;
const adminCooldownKey = (uid: string) => `hireall:admin-verify-cooldown:${uid}`;

function readPersistedAdminCache(uid: string): PersistedAdminCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(adminCacheKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAdminCache;
    if (!parsed || parsed.uid !== uid || typeof parsed.timestamp !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePersistedAdminCache(uid: string, user: any) {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedAdminCache = { uid, timestamp: Date.now(), user };
    window.localStorage.setItem(adminCacheKey(uid), JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function getCooldownUntil(uid: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(adminCooldownKey(uid));
    const millis = raw ? Number(raw) : 0;
    return Number.isFinite(millis) ? millis : 0;
  } catch {
    return 0;
  }
}

function setCooldownUntil(uid: string, untilMillis: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(adminCooldownKey(uid), String(untilMillis));
  } catch {
    // ignore
  }
}

function clearPersisted(uid: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(adminCacheKey(uid));
    window.localStorage.removeItem(adminCooldownKey(uid));
  } catch {
    // ignore
  }
}

// Authentication utility for admin modules
export const verifyAdminAccess = async () => {
  const auth = getAuthClient();
  if (!auth?.currentUser) {
    throw new Error("Authentication required");
  }

  const currentUid = auth.currentUser.uid;

  // Respect persisted cooldown (e.g., after 429).
  const now = Date.now();
  const cooldownUntil = getCooldownUntil(currentUid);
  if (cooldownUntil > now) {
    throw new Error("Admin verification rate-limited. Please retry shortly.");
  }

  // Prefer persisted success cache on reload.
  const persisted = readPersistedAdminCache(currentUid);
  if (persisted && now - persisted.timestamp < SUCCESS_CACHE_TTL_MS) {
    adminVerificationCache = { uid: currentUid, timestamp: persisted.timestamp, user: persisted.user };
    return persisted.user;
  }
  
  // Check if we have a valid cached result
  if (
    adminVerificationCache &&
    adminVerificationCache.uid === currentUid &&
    Date.now() - adminVerificationCache.timestamp < SUCCESS_CACHE_TTL_MS
  ) {
    return adminVerificationCache.user;
  }

  // If a previous verification failed recently, don't hammer the endpoint
  if (
    adminVerificationFailureCache &&
    adminVerificationFailureCache.uid === currentUid &&
    Date.now() - adminVerificationFailureCache.timestamp < FAILURE_COOLDOWN_MS
  ) {
    const status = adminVerificationFailureCache.status;
    if (status === 429) {
      throw new Error("Admin verification rate-limited. Please retry shortly.");
    }
    throw new Error("Admin access denied");
  }

  // De-dupe concurrent calls per uid (MUST be set before awaiting token)
  const existingInFlight = adminVerificationInFlightByUid.get(currentUid);
  if (existingInFlight) return existingInFlight;

  const inFlight = (async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Authentication required");
      }
      const token = await currentUser.getIdToken();
      const data = await apiClient.post<any>(
        "/admin/verify",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          retries: 0,
        }
      );

      adminVerificationFailureCache = null;
      adminVerificationCache = {
        user: data.user,
        timestamp: Date.now(),
        uid: currentUid,
      };

      writePersistedAdminCache(currentUid, data.user);

      return data.user;
    } catch (error: any) {
      adminVerificationCache = null;
      const status = typeof error?.status === "number" ? error.status : undefined;
      const retryAfterSeconds =
        typeof error?.retryAfter === "number" ? error.retryAfter :
        typeof error?.details?.retryAfter === "number" ? error.details.retryAfter :
        undefined;

      adminVerificationFailureCache = {
        timestamp: Date.now(),
        uid: currentUid,
        status,
        retryAfterSeconds,
      };

      if (status === 429) {
        // Back off using server-provided retryAfter when possible.
        const cooldownMs = Math.max(15_000, (retryAfterSeconds ?? 60) * 1000);
        setCooldownUntil(currentUid, Date.now() + cooldownMs);
        throw new Error("Admin verification rate-limited. Please retry shortly.");
      }

      // If non-429 failure, clear persisted cache so we don't keep stale admin state.
      clearPersisted(currentUid);
      throw new Error("Admin access denied");
    } finally {
      adminVerificationInFlightByUid.delete(currentUid);
    }
  })();

  adminVerificationInFlightByUid.set(currentUid, inFlight);
  return inFlight;
};

// Clear the admin verification cache (call on logout or when needed)
export const clearAdminVerificationCache = () => {
  const auth = getAuthClient();
  const uid = auth?.currentUser?.uid;
  if (uid) {
    clearPersisted(uid);
  }
  adminVerificationCache = null;
  adminVerificationFailureCache = null;
  adminVerificationInFlightByUid.clear();
};
