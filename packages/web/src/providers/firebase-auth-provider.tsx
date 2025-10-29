"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getAuthClient, addConnectionListener } from "@/firebase/client";
import { onAuthStateChanged, getRedirectResult, type User } from "firebase/auth";
import { showError, showSuccess } from "@/components/ui/Toast";
import { AuthError, createAuthError } from "./auth/auth-utils";
import { useAuthSessionManagement } from "./auth/useAuthSessionManagement";
import { usePopupSignIn } from "./auth/usePopupSignIn";
import { useAuthActions } from "./auth/useAuthActions";
import type { AuthState } from "./auth/types";

export { getLastAuthMethod } from "./auth/auth-utils";
export type { AuthError } from "./auth/auth-utils";
export type { AuthState } from "./auth/types";

type AuthActions = ReturnType<typeof useAuthActions>;

type AuthContextType = AuthState &
  AuthActions & {
    isSessionExpiring: boolean;
    error: AuthError | null;
    clearError: () => void;
  };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useFirebaseAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider");
  }
  return ctx;
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
  const redirectResultHandledRef = useRef(false);

  const { runPopupSignIn } = usePopupSignIn();

  const {
    syncAuthStateToClient,
    syncSessionCookieWithServer,
    clearServerSession,
    clearSessionTimeouts,
    setupSessionTimeouts,
  } = useAuthSessionManagement(setIsSessionExpiring);

  const clearError = useCallback(() => setError(null), []);

  const updateActivity = useCallback(() => {
    setState((prev) => ({ ...prev, lastActivity: Date.now() }));
  }, []);

  const handleAuthError = useCallback(
    (cause: unknown) => {
      const authError = createAuthError(cause);
      setError(authError);
      showError(authError.userMessage);
      throw authError;
    },
    [setError]
  );

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
          syncSessionCookieWithServer(user).catch((syncError) => {
            console.error("Failed to establish secure session", syncError);
          });
        }
      } else {
        clearSessionTimeouts();
        setIsSessionExpiring(false);
        if (!options?.skipSessionSync) {
          clearServerSession().catch((clearError) => {
            console.warn("Failed to clear secure session", clearError);
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

  const authActions = useAuthActions({
    setError,
    updateActivity,
    handleAuthError,
    syncSessionCookieWithServer,
    setIsSessionExpiring,
    clearSessionTimeouts,
    clearServerSession,
    setupSessionTimeouts,
    applyAuthSnapshot,
    runPopupSignIn,
    setState,
  });

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
      } catch (redirectError: any) {
        if (redirectError?.code === "auth/no-auth-event") {
          return;
        }

        console.error("Google redirect sign-in error:", redirectError);
        handleAuthError(redirectError);
      }
    })();
  }, [handleAuthError, syncSessionCookieWithServer, updateActivity]);

  useEffect(() => {
    const auth = getAuthClient();
    if (!auth) {
      setState((prev) => ({ ...prev, loading: false, isInitialized: true }));
      return;
    }

    const timeoutId = setTimeout(() => {
      setState((prev) => ({ ...prev, loading: false, isInitialized: true }));
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeoutId);
      applyAuthSnapshot(user ?? null);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
      clearSessionTimeouts();
    };
  }, [applyAuthSnapshot, clearSessionTimeouts]);

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

  useEffect(() => {
    const unsubscribe = addConnectionListener((connectionState) => {
      setState((prev) => ({ ...prev, isOnline: connectionState.isOnline }));
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    syncAuthStateToClient(state.user);

    if (state.user && typeof window !== "undefined") {
      const auth = getAuthClient();
      if (auth) {
        (window as any).__firebase_auth = auth;
      }
    }
  }, [state.user, syncAuthStateToClient]);

  const value: AuthContextType = {
    ...state,
    ...authActions,
    isSessionExpiring,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
