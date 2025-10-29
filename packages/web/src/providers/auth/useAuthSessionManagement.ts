import { useCallback, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { User } from "firebase/auth";
import { signOut } from "firebase/auth";
import { getAuthClient } from "@/firebase/client";
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  getCookieValue,
} from "./auth-utils";

export interface AuthSessionManager {
  syncAuthStateToClient: (user: User | null) => void;
  syncSessionCookieWithServer: (user: User) => Promise<void>;
  clearServerSession: () => Promise<void>;
  clearSessionTimeouts: () => void;
  setupSessionTimeouts: () => void;
}

export function useAuthSessionManagement(
  setIsSessionExpiring: Dispatch<SetStateAction<boolean>>
): AuthSessionManager {
  const lastSessionTokenRef = useRef<string | null>(null);
  const sessionSyncPromiseRef = useRef<Promise<void> | null>(null);
  const sessionClearPromiseRef = useRef<Promise<void> | null>(null);

  const syncAuthStateToClient = useCallback((user: User | null) => {
    if (typeof window === "undefined") return;

    try {
      if (user) {
        const payload = JSON.stringify({ id: user.uid });
        (window as any).__firebase_user = { id: user.uid };
        localStorage.setItem("__firebase_user", payload);
        document.cookie = `__firebase_user=${encodeURIComponent(
          payload
        )}; path=/; max-age=604800; samesite=strict`;
        window.postMessage(
          { type: "FIREBASE_AUTH_SUCCESS", uid: user.uid },
          window.location.origin
        );
      } else {
        delete (window as any).__firebase_user;
        localStorage.removeItem("__firebase_user");
        document.cookie =
          "__firebase_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.postMessage(
          { type: "FIREBASE_AUTH_LOGOUT" },
          window.location.origin
        );
      }
    } catch (storageError) {
      console.warn("Failed to sync auth state to client:", storageError);
    }
  }, []);

  const clearSessionTimeouts = useCallback(() => {
    if (typeof window === "undefined") return;

    if ((window as any).__sessionWarningTimeout) {
      clearTimeout((window as any).__sessionWarningTimeout);
      delete (window as any).__sessionWarningTimeout;
    }

    if ((window as any).__sessionTimeout) {
      clearTimeout((window as any).__sessionTimeout);
      delete (window as any).__sessionTimeout;
    }
  }, []);

  const setupSessionTimeouts = useCallback(() => {
    if (typeof window === "undefined") return;

    clearSessionTimeouts();

    const warningTimeout = setTimeout(() => {
      setIsSessionExpiring(true);
      console.warn("Session will expire in 1 hour");
    }, 23 * 60 * 60 * 1000);

    const sessionTimeout = setTimeout(async () => {
      console.warn("Session expired, signing out...");
      setIsSessionExpiring(false);
      try {
        const auth = getAuthClient();
        if (auth) await signOut(auth);
      } catch (error) {
        console.error("Error during automatic logout:", error);
      }
    }, 24 * 60 * 60 * 1000);

    (window as any).__sessionWarningTimeout = warningTimeout;
    (window as any).__sessionTimeout = sessionTimeout;
  }, [clearSessionTimeouts, setIsSessionExpiring]);

  const syncSessionCookieWithServer = useCallback(
    async (user: User) => {
      if (typeof window === "undefined") return;

      try {
        const idToken = await user.getIdToken();
        if (!idToken) return;

        if (
          lastSessionTokenRef.current === idToken &&
          !sessionSyncPromiseRef.current
        ) {
          return;
        }

        const ensureCsrfToken = async (): Promise<string | undefined> => {
          let csrfToken = getCookieValue(CSRF_COOKIE_NAME);

          if (!csrfToken) {
            try {
              await fetch("/api/auth/session", {
                method: "GET",
                credentials: "include",
                cache: "no-store",
                headers: {
                  "Cache-Control": "no-store",
                },
              });
            } catch (csrfFetchError) {
              console.warn("Failed to prime CSRF token", csrfFetchError);
            }

            csrfToken = getCookieValue(CSRF_COOKIE_NAME);
          }

          if (!csrfToken) {
            console.warn(
              "Missing CSRF token; skipping session cookie sync to avoid 401 response"
            );
            return undefined;
          }

          return csrfToken;
        };

        const RATE_LIMIT_MAX_ATTEMPTS = 3;

        const getBackoffDelayMs = (
          retryAfterHeader: string | null,
          attempt: number
        ) => {
          const retryAfterSeconds = retryAfterHeader
            ? Number.parseInt(retryAfterHeader, 10)
            : NaN;
          if (!Number.isNaN(retryAfterSeconds) && retryAfterSeconds >= 0) {
            return retryAfterSeconds * 1000;
          }

          const exponentialDelay = Math.min(2 ** attempt * 500, 5000);
          const jitter = Math.random() * 250;
          return exponentialDelay + jitter;
        };

        const executeSync = async (
          forceTokenRefresh: boolean,
          attempt: number
        ): Promise<void> => {
          const idTokenToUse = await user.getIdToken(forceTokenRefresh);
          if (!idTokenToUse) {
            return;
          }

          if (
            attempt === 0 &&
            lastSessionTokenRef.current === idTokenToUse
          ) {
            return;
          }

          const csrfToken = await ensureCsrfToken();
          if (!csrfToken) {
            lastSessionTokenRef.current = null;
            return;
          }

          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            [CSRF_HEADER_NAME]: csrfToken,
          };

          const response = await fetch("/api/auth/session", {
            method: "POST",
            credentials: "include",
            headers,
            body: JSON.stringify({ idToken: idTokenToUse }),
          });

          if (response.ok) {
            lastSessionTokenRef.current = idTokenToUse;
            return;
          }

          let errorMessage: string | undefined;
          try {
            const data = await response.json();
            if (
              data &&
              typeof data === "object" &&
              typeof (data as any).error === "string"
            ) {
              errorMessage = (data as any).error;
            }
          } catch {
            // ignore JSON parsing errors
          }

          const normalizedError = (errorMessage || "").toLowerCase();

          if (response.status === 401 && attempt < 2) {
            if (normalizedError.includes("csrf")) {
              document.cookie = `${CSRF_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
              lastSessionTokenRef.current = null;
              await executeSync(false, attempt + 1);
              return;
            }

            await executeSync(true, attempt + 1);
            return;
          }

          if (response.status === 429) {
            if (attempt < RATE_LIMIT_MAX_ATTEMPTS) {
              const delayMs = getBackoffDelayMs(
                response.headers.get("Retry-After"),
                attempt
              );
              console.warn(
                `Session sync rate limited (attempt ${
                  attempt + 1
                }); retrying in ${Math.round(delayMs)}ms`
              );
              await new Promise((resolve) => setTimeout(resolve, delayMs));
              await executeSync(forceTokenRefresh, attempt + 1);
              return;
            }

            console.warn(
              "Session sync rate limited; max retries reached. Skipping update until next auth change."
            );
            lastSessionTokenRef.current = null;
            return;
          }

          const message =
            errorMessage ||
            `Failed to establish session (status ${response.status})`;
          throw new Error(message);
        };

        const syncPromise = executeSync(false, 0);

        sessionSyncPromiseRef.current = syncPromise
          .catch((error) => {
            lastSessionTokenRef.current = null;
            console.error("Failed to sync server session cookie", error);
            throw error;
          })
          .finally(() => {
            sessionSyncPromiseRef.current = null;
          });

        await sessionSyncPromiseRef.current;
      } catch (error) {
        lastSessionTokenRef.current = null;
        console.error("Session cookie sync failed", error);
      }
    }, []
  );

  const clearServerSession = useCallback(async () => {
    if (typeof window === "undefined") return;

    if (sessionClearPromiseRef.current) {
      await sessionClearPromiseRef.current;
      return;
    }

    const csrfToken = getCookieValue(CSRF_COOKIE_NAME);
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers[CSRF_HEADER_NAME] = csrfToken;
    }

    const clearPromise = fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "include",
      headers,
    })
      .then((response) => {
        if (
          !response.ok &&
          response.status !== 401 &&
          response.status !== 404
        ) {
          throw new Error(`Failed to clear session (status ${response.status})`);
        }
        lastSessionTokenRef.current = null;
      })
      .catch((error) => {
        lastSessionTokenRef.current = null;
        console.warn("Failed to clear server session", error);
      })
      .finally(() => {
        sessionClearPromiseRef.current = null;
      });

    sessionClearPromiseRef.current = clearPromise;
    await clearPromise;
  }, []);

  return {
    syncAuthStateToClient,
    syncSessionCookieWithServer,
    clearServerSession,
    clearSessionTimeouts,
    setupSessionTimeouts,
  };
}
