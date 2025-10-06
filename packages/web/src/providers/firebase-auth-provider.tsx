"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  getAuthClient,
  getGoogleProvider,
  addConnectionListener,
  ensureFirebaseApp,
} from "@/firebase/client";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  OAuthProvider,
  GithubAuthProvider,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  updateEmail,
  deleteUser,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type AuthProvider,
} from "firebase/auth";
import { showError, showSuccess } from "@/components/ui/Toast";

export interface AuthError {
  code: string;
  message: string;
  userMessage: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  isOnline: boolean;
  isInitialized: boolean;
  lastActivity: number | null;
}

type AuthContextType = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleRedirect: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  updateProfile: (updates: {
    displayName?: string;
    photoURL?: string;
  }) => Promise<void>;
  updateEmail: (newEmail: string, password: string) => Promise<void>;
  updatePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  reloadUser: () => Promise<void>;
  isSessionExpiring: boolean;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  error: AuthError | null;
};

const LAST_AUTH_METHOD_KEY = "hireall_last_auth_method";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type PopupProviderKey = "google" | "github" | "microsoft";

// Store last used auth method
const storeLastAuthMethod = (method: string) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LAST_AUTH_METHOD_KEY, method);
    } catch (error) {
      console.warn("Failed to store last auth method:", error);
    }
  }
};

// Get last used auth method
const getLastAuthMethod = (): string | null => {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(LAST_AUTH_METHOD_KEY);
    } catch (error) {
      console.warn("Failed to get last auth method:", error);
      return null;
    }
  }
  return null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useFirebaseAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider");
  return ctx;
}

// Export for use in components
export { getLastAuthMethod };

const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_COOKIE_NAME = "__csrf-token";

function getCookieValue(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;

  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const cookie of cookies) {
    const [rawName, ...rest] = cookie.trim().split("=");
    if (rawName === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return undefined;
}

// Auth error mapping for user-friendly messages
const DEFAULT_AUTH_ERROR_MESSAGE = "An error occurred during authentication. Please try again.";

const sanitizeAuthMessage = (message?: string): string => {
  if (!message) return DEFAULT_AUTH_ERROR_MESSAGE;
  let cleaned = message.replace(/^Firebase:\s*/i, "").trim();
  cleaned = cleaned.replace(/^Error\s*/i, "").trim();
  cleaned = cleaned.replace(/\([^)]*\)/g, "").trim();
  if (!cleaned) return DEFAULT_AUTH_ERROR_MESSAGE;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const AUTH_ERRORS: Record<string, string> = {
  "auth/user-disabled":
    "Your account has been disabled. Please contact support.",
  "auth/user-not-found": "No account found with this email address.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password should be at least 6 characters long.",
  "auth/operation-not-allowed": "This sign-in method is not enabled.",
  "auth/account-exists-with-different-credential":
    "An account already exists with the same email but different sign-in credentials.",
  "auth/invalid-credential": "Invalid credentials. Please try again.",
  "auth/credential-already-in-use":
    "This credential is already associated with a different user account.",
  "auth/timeout": "The operation has timed out. Please try again.",
  "auth/network-request-failed":
    "Network error. Please check your connection and try again.",
  "auth/too-many-requests": "Too many failed attempts. Please try again later.",
  "auth/requires-recent-login":
    "This operation requires recent authentication. Please sign in again.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/popup-blocked": "Sign-in popup was blocked by your browser.",
  "auth/popup-closed-by-user": "Sign-in popup was closed before completing.",
  "auth/popup-already-in-progress":
    "Another sign-in window is already open. Please finish it before starting a new one.",
  "auth/web-storage-unsupported":
    "Browser storage is blocked. Enable cookies or switch to a different browser.",
  "auth/operation-not-supported-in-this-environment":
    "This browser does not support popup sign-in. Please try a different browser or use the email option instead.",
  "auth/internal-error":
    "Something went wrong while contacting Google. Please try again.",
};

// Create user-friendly error
function createAuthError(error: any): AuthError {
  const code = error?.code || "auth/unknown-error";

  const sanitizedMessage = sanitizeAuthMessage(error?.message);
  const userMessage = AUTH_ERRORS[code] || sanitizedMessage;

  return { code, message: sanitizedMessage, userMessage };
}

export function FirebaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isInitialized: false,
    lastActivity: null,
  });
  const [error, setError] = useState<AuthError | null>(null);
  const [isSessionExpiring, setIsSessionExpiring] = useState(false);
  const lastSessionTokenRef = useRef<string | null>(null);
  const sessionSyncPromiseRef = useRef<Promise<void> | null>(null);
  const sessionClearPromiseRef = useRef<Promise<void> | null>(null);
  const redirectResultHandledRef = useRef(false);
  const popupStatesRef = useRef<Record<PopupProviderKey, { locked: boolean; retryCount: number }>>({
    google: { locked: false, retryCount: 0 },
    github: { locked: false, retryCount: 0 },
    microsoft: { locked: false, retryCount: 0 },
  });

  // Clear error callback
  const clearError = useCallback(() => setError(null), []);

  // Update user activity
  const updateActivity = useCallback(() => {
    setState((prev) => ({ ...prev, lastActivity: Date.now() }));
  }, []);

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

  const syncSessionCookieWithServer = useCallback(
    async (user: User) => {
      if (typeof window === "undefined") return;

      try {
        const idToken = await user.getIdToken();
        if (!idToken) return;

        if (lastSessionTokenRef.current === idToken && !sessionSyncPromiseRef.current) {
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
            console.warn("Missing CSRF token; skipping session cookie sync to avoid 401 response");
            return undefined;
          }

          return csrfToken;
        };

        const executeSync = async (
          forceTokenRefresh: boolean,
          attempt: number,
        ): Promise<void> => {
          const idTokenToUse = await user.getIdToken(forceTokenRefresh);
          if (!idTokenToUse) {
            return;
          }

          if (attempt === 0 && lastSessionTokenRef.current === idTokenToUse) {
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
            if (data && typeof data === "object" && typeof data.error === "string") {
              errorMessage = data.error;
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

          const message = errorMessage || `Failed to establish session (status ${response.status})`;
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
    },
    [],
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
        if (!response.ok && response.status !== 401 && response.status !== 404) {
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

  const runPopupSignIn = useCallback(
    async <T extends AuthProvider>(
      key: PopupProviderKey,
      providerFactory: () => T | undefined,
      options: {
        successMessage: string;
        retryOnEarlyClose?: boolean;
        beforeAttempt?: () => void;
      }
    ): Promise<boolean> => {
      const state =
        popupStatesRef.current[key] ??
        (popupStatesRef.current[key] = { locked: false, retryCount: 0 });

      if (state.locked) {
        showError(
          "Another sign-in window is already open. Please finish it before starting a new one."
        );
        return false;
      }

      state.locked = true;
      state.retryCount = 0;

      try {
        ensureFirebaseApp();
        const auth = getAuthClient();
        if (!auth) {
          throw new Error("Auth not available");
        }

        const provider = providerFactory();
        if (!provider) {
          throw new Error("Auth provider not available");
        }

        options.beforeAttempt?.();

        const attempt = async (): Promise<void> => {
          const attemptStartedAt = Date.now();

          try {
            await signInWithPopup(auth, provider);
            showSuccess(options.successMessage);
          } catch (error: any) {
            const code = error?.code as string | undefined;
            if (
              options.retryOnEarlyClose !== false &&
              state.retryCount < 1 &&
              (code === "auth/popup-closed-by-user" ||
                code === "auth/cancelled-popup-request") &&
              Date.now() - attemptStartedAt < 1200
            ) {
              state.retryCount += 1;
              await delay(350);
              return attempt();
            }

            throw error;
          }
        };

        await attempt();
        return true;
      } finally {
        state.locked = false;
      }
    },
    []
  );

  // Handle authentication errors
  const handleAuthError = useCallback((error: any) => {
    const authError = createAuthError(error);
    setError(authError);
    showError(authError.userMessage);
    throw authError;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (redirectResultHandledRef.current) return;

    redirectResultHandledRef.current = true;

    const auth = getAuthClient();
    if (!auth) return;

    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!result || !result.user) {
          return;
        }

        showSuccess("Successfully signed in with Google!");
        await syncSessionCookieWithServer(result.user);
        updateActivity();
      } catch (error: any) {
        if (error?.code === "auth/no-auth-event") {
          return;
        }

        console.error("Google redirect sign-in error:", error);
        handleAuthError(error);
      }
    })();
  }, [handleAuthError, syncSessionCookieWithServer, updateActivity]);

  // Clear session timeouts
  const clearSessionTimeouts = useCallback(() => {
    if ((window as any).__sessionWarningTimeout) {
      clearTimeout((window as any).__sessionWarningTimeout);
      delete (window as any).__sessionWarningTimeout;
    }
    if ((window as any).__sessionTimeout) {
      clearTimeout((window as any).__sessionTimeout);
      delete (window as any).__sessionTimeout;
    }
  }, []);

  // Setup session timeouts
  const setupSessionTimeouts = useCallback(() => {
    clearSessionTimeouts();

    // Session expiration warning (23 hours)
    const warningTimeout = setTimeout(() => {
      setIsSessionExpiring(true);
      console.warn("Session will expire in 1 hour");
    }, 23 * 60 * 60 * 1000);

    // Session timeout (24 hours)
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

    // Store timeout IDs
    (window as any).__sessionWarningTimeout = warningTimeout;
    (window as any).__sessionTimeout = sessionTimeout;
  }, [clearSessionTimeouts]);

  // Apply Firebase auth changes to local state and optionally mirror cookies/server-side session.
  // When skipSessionSync is true we rely on the auth state listener to perform the server sync once it fires.
  const applyAuthSnapshot = useCallback(
    (user: User | null, options?: { skipSessionSync?: boolean }) => {
      syncAuthStateToClient(user);

      setState((prev) => ({
        ...prev,
        user,
        loading: false,
        isInitialized: true,
        lastActivity: user ? Date.now() : null,
      }));

      if (user) {
        setError(null);
        setupSessionTimeouts();
        if (!options?.skipSessionSync) {
          syncSessionCookieWithServer(user).catch((error) => {
            console.error("Failed to establish secure session", error);
          });
        }
      } else {
        clearSessionTimeouts();
        setIsSessionExpiring(false);
        if (!options?.skipSessionSync) {
          clearServerSession().catch((error) => {
            console.warn("Failed to clear secure session", error);
          });
        }
      }
    },
    [
      clearServerSession,
      clearSessionTimeouts,
      setIsSessionExpiring,
      setupSessionTimeouts,
      syncAuthStateToClient,
      syncSessionCookieWithServer,
    ]
  );

  

  // Initialize auth state listener
  useEffect(() => {
    const auth = getAuthClient();
    if (!auth) {
      setState((prev) => ({ ...prev, loading: false, isInitialized: true }));
      return;
    }

    // Set a timeout to ensure loading state is eventually set to false
    const timeoutId = setTimeout(() => {
      setState((prev) => ({ ...prev, loading: false, isInitialized: true }));
    }, 5000); // 5 second timeout

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeoutId);
      applyAuthSnapshot(user ?? null);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
      // Clear timeouts on cleanup - functions will be defined by this point
      if ((window as any).__sessionWarningTimeout) {
        clearTimeout((window as any).__sessionWarningTimeout);
        delete (window as any).__sessionWarningTimeout;
      }
      if ((window as any).__sessionTimeout) {
        clearTimeout((window as any).__sessionTimeout);
        delete (window as any).__sessionTimeout;
      }
    };
  }, [applyAuthSnapshot]);



  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Monitor Firebase connection
  useEffect(() => {
    const unsubscribe = addConnectionListener((connectionState) => {
      setState((prev) => ({ ...prev, isOnline: connectionState.isOnline }));
    });

    return unsubscribe;
  }, []);

  // Broadcast auth state to extension
  useEffect(() => {
    syncAuthStateToClient(state.user);
    
    // Also make auth instance available to extension
    if (state.user && typeof window !== "undefined") {
      const auth = getAuthClient();
      if (auth) {
        (window as any).__firebase_auth = auth;
      }
    }
  }, [state.user, syncAuthStateToClient]);

  // Auth methods
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null);
        updateActivity();
        storeLastAuthMethod("email");
        const auth = getAuthClient();
        if (!auth) throw new Error("Auth not available");

        await signInWithEmailAndPassword(auth, email, password);

        if (auth.currentUser) {
          await syncSessionCookieWithServer(auth.currentUser);
        }

        showSuccess("Successfully signed in!");
      } catch (error) {
        handleAuthError(error);
      }
    },
    [handleAuthError, syncSessionCookieWithServer, updateActivity]
  );

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        setError(null);
        updateActivity();
        const auth = getAuthClient();
        if (!auth) throw new Error("Auth not available");

        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await syncSessionCookieWithServer(credential.user);

        if (name) {
          await updateProfile(credential.user, { displayName: name });
        }

        try {
          await fetch("/api/email/welcome", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credential.user.email ?? email,
              name: name ?? credential.user.displayName ?? undefined,
            }),
          });
        } catch (sendError) {
          console.warn("Failed to trigger welcome email", sendError);
        }

        showSuccess("Account created successfully!");
      } catch (error) {
        handleAuthError(error);
      }
    },
    [handleAuthError, syncSessionCookieWithServer, updateActivity]
  );

  const signInWithGoogleRedirect = useCallback(async () => {
    setError(null);
    updateActivity();

    try {
      ensureFirebaseApp();
      const auth = getAuthClient();
      if (!auth) {
        throw new Error("Auth not available");
      }

      const provider = getGoogleProvider();
      if (!provider) {
        throw new Error("Google auth provider not available");
      }

      storeLastAuthMethod("google");
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      const code: string | undefined = error?.code;

      if (code === "auth/operation-not-supported-in-this-environment") {
        const message =
          "This browser cannot complete Google sign-in automatically. Please use email sign-in instead.";
        showError(message);
        throw new Error(message);
      }

      if (
        error?.message?.includes("storage-partitioned") ||
        error?.message?.includes("sessionStorage is inaccessible")
      ) {
        const errorMessage =
          "Browser storage is restricted. Enable third-party cookies or use a normal browsing window before trying again.";
        showError(errorMessage);
        throw new Error(errorMessage);
      }

      handleAuthError(error);
    }
  }, [handleAuthError, updateActivity]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    updateActivity();

    try {
      const executed = await runPopupSignIn(
        "google",
        () => getGoogleProvider(),
        {
          successMessage: "Successfully signed in with Google!",
          beforeAttempt: () => storeLastAuthMethod("google"),
        }
      );

      if (!executed) {
        return;
      }

      const auth = getAuthClient();
      if (auth?.currentUser) {
        await syncSessionCookieWithServer(auth.currentUser);
      }
    } catch (error: any) {
      const code: string | undefined = error?.code;

      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        if (process.env.NODE_ENV === "development") {
          console.info("Google sign-in popup closed early", error);
        }
        const friendlyMessage =
          "The Google sign-in window closed before it could finish. Allow popups for Hireall and try again.";
        showError(friendlyMessage);
        throw new Error(friendlyMessage);
      }

      if (code === "auth/popup-blocked") {
        const message =
          "Your browser blocked the Google sign-in window. Enable popups for Hireall and try again.";
        showError(message);
        throw new Error(message);
      }

      if (
        code === "auth/web-storage-unsupported" ||
        error?.message?.toLowerCase?.().includes("web storage") ||
        error?.message?.toLowerCase?.().includes("cookies are not enabled")
      ) {
        const message =
          "Google sign-in needs browser storage. Enable cookies or use a normal browsing window and try again.";
        showError(message);
        throw new Error(message);
      }

      if (
        error?.message?.includes("storage-partitioned") ||
        error?.message?.includes("sessionStorage is inaccessible")
      ) {
        const errorMessage =
          "Browser storage is restricted. Please:\n1. Enable third-party cookies for this site\n2. Try in a normal browser window (not incognito)\n3. Or use email/password sign-in instead";
        showError(errorMessage);
        throw new Error(errorMessage);
      }

      console.error("Google sign-in error:", error);
      console.error("Error details:", {
        code: error?.code,
        message: error?.message,
        name: error?.name,
      });

      handleAuthError(error);
    }
  }, [handleAuthError, runPopupSignIn, syncSessionCookieWithServer, updateActivity]);

  const signInWithGitHub = useCallback(async () => {
    try {
      setError(null);
      updateActivity();

      const executed = await runPopupSignIn(
        "github",
        () => {
          const provider = new GithubAuthProvider();
          provider.setCustomParameters({ prompt: "select_account" });
          return provider;
        },
        {
          successMessage: "Successfully signed in with GitHub!",
          beforeAttempt: () => storeLastAuthMethod("github"),
        }
      );

      if (!executed) {
        return;
      }

      const auth = getAuthClient();
      if (auth?.currentUser) {
        await syncSessionCookieWithServer(auth.currentUser);
      }
    } catch (error) {
      handleAuthError(error);
    }
  }, [handleAuthError, runPopupSignIn, syncSessionCookieWithServer, updateActivity]);

  const signInWithMicrosoft = useCallback(async () => {
    try {
      setError(null);
      updateActivity();
      const executed = await runPopupSignIn(
        "microsoft",
        () => {
          const provider = new OAuthProvider("microsoft.com");
          provider.setCustomParameters({ prompt: "select_account" });
          return provider;
        },
        {
          successMessage: "Successfully signed in with Microsoft!",
          beforeAttempt: () => storeLastAuthMethod("microsoft"),
        }
      );

      if (!executed) {
        return;
      }

      const auth = getAuthClient();
      if (auth?.currentUser) {
        await syncSessionCookieWithServer(auth.currentUser);
      }
    } catch (error) {
      handleAuthError(error);
    }
  }, [handleAuthError, runPopupSignIn, syncSessionCookieWithServer, updateActivity]);

  const signOutUser = useCallback(async () => {
    try {
      setError(null);
      const auth = getAuthClient();
      if (!auth) return;

      await signOut(auth);
      clearSessionTimeouts();
      setIsSessionExpiring(false);
      await clearServerSession();
      showSuccess("Successfully signed out!");
    } catch (error) {
      handleAuthError(error);
    }
  }, [clearServerSession, handleAuthError, clearSessionTimeouts]);

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        setError(null);
        const auth = getAuthClient();
        if (!auth) throw new Error("Auth not available");

        await sendPasswordResetEmail(auth, email);
        showSuccess("Password reset email sent!");
      } catch (error) {
        handleAuthError(error);
      }
    },
    [handleAuthError]
  );

  const sendEmailVerificationToUser = useCallback(async () => {
    try {
      setError(null);
      const auth = getAuthClient();
      if (!auth || !auth.currentUser) throw new Error("No authenticated user");

      await sendEmailVerification(auth.currentUser);
      showSuccess("Verification email sent!");
    } catch (error) {
      handleAuthError(error);
    }
  }, [handleAuthError]);

  const updateUserProfile = useCallback(
    async (updates: { displayName?: string; photoURL?: string }) => {
      try {
        setError(null);
        const auth = getAuthClient();
        if (!auth || !auth.currentUser)
          throw new Error("No authenticated user");

        await updateProfile(auth.currentUser, updates);
        showSuccess("Profile updated successfully!");
      } catch (error) {
        handleAuthError(error);
      }
    },
    [handleAuthError]
  );

  const updateUserEmail = useCallback(
    async (newEmail: string, password: string) => {
      try {
        setError(null);
        const auth = getAuthClient();
        if (!auth || !auth.currentUser)
          throw new Error("No authenticated user");

        // Reauthenticate first
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email!,
          password
        );
        await reauthenticateWithCredential(auth.currentUser, credential);

        await updateEmail(auth.currentUser, newEmail);
        showSuccess("Email updated successfully!");
      } catch (error) {
        handleAuthError(error);
      }
    },
    [handleAuthError]
  );

  const updateUserPassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        setError(null);
        const auth = getAuthClient();
        if (!auth || !auth.currentUser)
          throw new Error("No authenticated user");

        // Reauthenticate first
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email!,
          currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);

        await updatePassword(auth.currentUser, newPassword);
        showSuccess("Password updated successfully!");
      } catch (error) {
        handleAuthError(error);
      }
    },
    [handleAuthError]
  );

  const deleteUserAccount = useCallback(
    async (password: string) => {
      try {
        setError(null);
        const auth = getAuthClient();
        if (!auth || !auth.currentUser)
          throw new Error("No authenticated user");

        // Reauthenticate first
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email!,
          password
        );
        await reauthenticateWithCredential(auth.currentUser, credential);

        await deleteUser(auth.currentUser);
        showSuccess("Account deleted successfully!");
      } catch (error) {
        handleAuthError(error);
      }
    },
    [handleAuthError]
  );

  const reauthenticateUser = useCallback(
    async (password: string) => {
      try {
        setError(null);
        const auth = getAuthClient();
        if (!auth || !auth.currentUser)
          throw new Error("No authenticated user");

        const credential = EmailAuthProvider.credential(
          auth.currentUser.email!,
          password
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
      } catch (error) {
        handleAuthError(error);
      }
    },
    [handleAuthError]
  );

  const reloadUser = useCallback(async () => {
    try {
      setError(null);
      const auth = getAuthClient();
      if (!auth || !auth.currentUser) throw new Error("No authenticated user");

      await auth.currentUser.reload();
      applyAuthSnapshot(auth.currentUser, { skipSessionSync: true });
    } catch (error) {
      handleAuthError(error);
    }
  }, [applyAuthSnapshot, handleAuthError]);

  const refreshToken = useCallback(async () => {
    try {
      setError(null);
      const auth = getAuthClient();
      if (!auth || !auth.currentUser) throw new Error("No authenticated user");

      await auth.currentUser.getIdToken(true);
      await syncSessionCookieWithServer(auth.currentUser);
      setupSessionTimeouts();
      setIsSessionExpiring(false);
    } catch (error) {
      handleAuthError(error);
    }
  }, [handleAuthError, setupSessionTimeouts, syncSessionCookieWithServer]);

  const value: AuthContextType = {
    ...state,
    isSessionExpiring,
    error,
    clearError,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGoogleRedirect,
    signInWithGitHub,
    signInWithMicrosoft,
    signOut: signOutUser,
    resetPassword,
    sendEmailVerification: sendEmailVerificationToUser,
    updateProfile: updateUserProfile,
    updateEmail: updateUserEmail,
    updatePassword: updateUserPassword,
    deleteAccount: deleteUserAccount,
    reauthenticate: reauthenticateUser,
    reloadUser,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
