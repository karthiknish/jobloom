"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  getAuthClient,
  getGoogleProvider,
  getConnectionState,
  addConnectionListener,
} from "@/firebase/client";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  OAuthProvider,
  GithubAuthProvider,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  updateEmail,
  deleteUser,
  connectAuthEmulator,
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
  isSessionExpiring: boolean;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  error: AuthError | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useFirebaseAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider");
  return ctx;
}

// Auth error mapping for user-friendly messages
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
};

// Create user-friendly error
function createAuthError(error: any): AuthError {
  const code = error?.code || "auth/unknown-error";
  const message = error?.message || "An unknown error occurred";
  const userMessage =
    AUTH_ERRORS[code] ||
    "An error occurred during authentication. Please try again.";

  return { code, message, userMessage };
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

  // Clear error callback
  const clearError = useCallback(() => setError(null), []);

  // Update user activity
  const updateActivity = useCallback(() => {
    setState((prev) => ({ ...prev, lastActivity: Date.now() }));
  }, []);

  // Handle authentication errors
  const handleAuthError = useCallback((error: any) => {
    const authError = createAuthError(error);
    setError(authError);
    showError(authError.userMessage);
    throw authError;
  }, []);

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

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(timeoutId);
      setState((prev) => ({
        ...prev,
        user,
        loading: false,
        isInitialized: true,
        lastActivity: user ? Date.now() : null,
      }));

      // Clear any previous errors on successful auth state change
      if (user) {
        setError(null);
      }

      // Handle session management
      if (user) {
        setupSessionTimeouts();
      } else {
        clearSessionTimeouts();
        setIsSessionExpiring(false);
      }
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
  }, []);

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
    if (typeof window === "undefined") return;

    try {
      if (state.user) {
        (window as any).__firebase_user = { id: state.user.uid };
        localStorage.setItem(
          "__firebase_user",
          JSON.stringify({ id: state.user.uid })
        );
        document.cookie = `__firebase_user=${JSON.stringify({
          id: state.user.uid,
        })}; path=/; max-age=604800; samesite=strict`;
        window.postMessage(
          { type: "FIREBASE_AUTH_SUCCESS", uid: state.user.uid },
          window.location.origin
        );
      } else {
        delete (window as any).__firebase_user;
        localStorage.removeItem("__firebase_user");
        document.cookie =
          "__firebase_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    } catch {
      // Ignore storage errors
    }
  }, [state.user]);

  // Auth methods
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null);
        updateActivity();
        const auth = getAuthClient();
        if (!auth) throw new Error("Auth not available");

        await signInWithEmailAndPassword(auth, email, password);
        showSuccess("Successfully signed in!");
      } catch (error) {
        handleAuthError(error);
      }
    },
    [handleAuthError, updateActivity]
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
    [handleAuthError, updateActivity]
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      updateActivity();
      const auth = getAuthClient();
      const provider = getGoogleProvider();
      if (!auth || !provider) throw new Error("Auth not available");

      await signInWithPopup(auth, provider);
      showSuccess("Successfully signed in with Google!");
    } catch (error) {
      handleAuthError(error);
    }
  }, [handleAuthError, updateActivity]);

  const signInWithGitHub = useCallback(async () => {
    try {
      setError(null);
      updateActivity();
      const auth = getAuthClient();
      if (!auth) throw new Error("Auth not available");

      const provider = new GithubAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      showSuccess("Successfully signed in with GitHub!");
    } catch (error) {
      handleAuthError(error);
    }
  }, [handleAuthError, updateActivity]);

  const signInWithMicrosoft = useCallback(async () => {
    try {
      setError(null);
      updateActivity();
      const auth = getAuthClient();
      if (!auth) throw new Error("Auth not available");

      const provider = new OAuthProvider("microsoft.com");
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      showSuccess("Successfully signed in with Microsoft!");
    } catch (error) {
      handleAuthError(error);
    }
  }, [handleAuthError, updateActivity]);

  const signOutUser = useCallback(async () => {
    try {
      setError(null);
      const auth = getAuthClient();
      if (!auth) return;

      await signOut(auth);
      clearSessionTimeouts();
      setIsSessionExpiring(false);
      showSuccess("Successfully signed out!");
    } catch (error) {
      handleAuthError(error);
    }
  }, [handleAuthError, clearSessionTimeouts]);

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

  const refreshToken = useCallback(async () => {
    try {
      setError(null);
      const auth = getAuthClient();
      if (!auth || !auth.currentUser) throw new Error("No authenticated user");

      await auth.currentUser.getIdToken(true);
      setupSessionTimeouts();
      setIsSessionExpiring(false);
    } catch (error) {
      handleAuthError(error);
    }
  }, [handleAuthError, setupSessionTimeouts]);

  const value: AuthContextType = {
    ...state,
    isSessionExpiring,
    error,
    clearError,
    signIn,
    signUp,
    signInWithGoogle,
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
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
