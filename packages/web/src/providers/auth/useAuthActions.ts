import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  ensureFirebaseApp,
  getAuthClient,
  getGoogleProvider,
} from "@/firebase/client";
import { showError, showSuccess } from "@/components/ui/Toast";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  LAST_AUTH_METHOD_KEY,
  storeLastAuthMethod,
} from "./auth-utils";
import type { AuthError } from "./auth-utils";
import type { AuthState } from "./types";
import {
  createGithubPopupProvider,
  createGooglePopupProvider,
  createMicrosoftPopupProvider,
  type RunPopupSignIn,
} from "./usePopupSignIn";
import { apiClient } from "@/lib/api/client";

interface AuthActionDependencies {
  setError: Dispatch<SetStateAction<AuthError | null>>;
  updateActivity: () => void;
  handleAuthError: (error: unknown) => never;
  syncSessionCookieWithServer: (user: User) => Promise<void>;
  setIsSessionExpiring: Dispatch<SetStateAction<boolean>>;
  clearSessionTimeouts: () => void;
  clearServerSession: () => Promise<void>;
  setupSessionTimeouts: () => void;
  applyAuthSnapshot: (user: User | null, options?: { skipSessionSync?: boolean }) => void;
  runPopupSignIn: RunPopupSignIn;
  setState: Dispatch<SetStateAction<AuthState>>;
}

export function useAuthActions({
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
}: AuthActionDependencies) {
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null);
        setState(prev => ({ ...prev, loading: true }));
        updateActivity();
        const auth = getAuthClient();
        if (!auth) throw new Error("Auth not available");

        await signInWithEmailAndPassword(auth, email, password);

        if (auth.currentUser) {
          await syncSessionCookieWithServer(auth.currentUser);
        }

        showSuccess("Successfully signed in!");
      } catch (error) {
        handleAuthError(error);
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    },
    [handleAuthError, setError, syncSessionCookieWithServer, updateActivity, setState]
  );

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        setError(null);
        setState(prev => ({ ...prev, loading: true }));
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
          await apiClient.post("/email/welcome", {
            email: credential.user.email ?? email,
            name: name ?? credential.user.displayName ?? undefined,
          });
        } catch (sendError) {
          console.warn("Failed to trigger welcome email", sendError);
        }

        showSuccess("Account created successfully!");
      } catch (error) {
        handleAuthError(error);
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    },
    [handleAuthError, setError, syncSessionCookieWithServer, updateActivity, setState]
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
  }, [handleAuthError, setError, updateActivity]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setState(prev => ({ ...prev, loading: true }));
    updateActivity();

    try {
      const executed = await runPopupSignIn(
        "google",
        createGooglePopupProvider,
        {
          successMessage: "Successfully signed in with Google!",
          beforeAttempt: () => storeLastAuthMethod("google"),
        }
      );

      if (!executed) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const auth = getAuthClient();
      if (auth?.currentUser) {
        await syncSessionCookieWithServer(auth.currentUser);
      }
    } catch (error: any) {
      // ... (error handling)
      handleAuthError(error);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [handleAuthError, runPopupSignIn, setError, syncSessionCookieWithServer, updateActivity, setState]);

  const signInWithGitHub = useCallback(async () => {
    try {
      setError(null);
      updateActivity();

      const executed = await runPopupSignIn(
        "github",
        createGithubPopupProvider,
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
  }, [handleAuthError, runPopupSignIn, setError, syncSessionCookieWithServer, updateActivity]);

  const signInWithMicrosoft = useCallback(async () => {
    try {
      setError(null);
      updateActivity();

      const executed = await runPopupSignIn(
        "microsoft",
        createMicrosoftPopupProvider,
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
  }, [handleAuthError, runPopupSignIn, setError, syncSessionCookieWithServer, updateActivity]);

  const signOutUser = useCallback(async () => {
    try {
      setError(null);
      const auth = getAuthClient();
      if (!auth) {
        console.warn("Auth not available during sign out");
        return;
      }

      setState((prev) => ({ ...prev, user: null, loading: false, isInitialized: false }));

      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(LAST_AUTH_METHOD_KEY);
          sessionStorage.clear();
        } catch (error) {
          console.warn("Failed to clear local storage:", error);
        }
      }

      await signOut(auth);
      clearSessionTimeouts();
      setIsSessionExpiring(false);
      await clearServerSession();

      showSuccess("Successfully signed out!");

      if (typeof window !== "undefined") {
        window.location.href = "/sign-in";
      }
    } catch (error) {
      console.error("Sign out error:", error);
      handleAuthError(error);

      if (typeof window !== "undefined") {
        window.location.href = "/sign-in";
      }
    }
  }, [
    clearServerSession,
    clearSessionTimeouts,
    handleAuthError,
    setError,
    setIsSessionExpiring,
    setState,
  ]);

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
    [handleAuthError, setError]
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
  }, [handleAuthError, setError]);

  const updateUserProfile = useCallback(
    async (updates: { displayName?: string; photoURL?: string }) => {
      try {
        setError(null);
        const auth = getAuthClient();
        if (!auth || !auth.currentUser) throw new Error("No authenticated user");

        await updateProfile(auth.currentUser, updates);
        showSuccess("Profile updated successfully!");
      } catch (error) {
        handleAuthError(error);
      }
    },
    [handleAuthError, setError]
  );

  const updateUserEmail = useCallback(
    async (newEmail: string, password: string) => {
      try {
        setError(null);
        const auth = getAuthClient();
        if (!auth || !auth.currentUser) throw new Error("No authenticated user");

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
    [handleAuthError, setError]
  );

  const updateUserPassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        setError(null);
        const auth = getAuthClient();
        if (!auth || !auth.currentUser) throw new Error("No authenticated user");

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
    [handleAuthError, setError]
  );

  const deleteUserAccount = useCallback(
    async (password: string) => {
      try {
        setError(null);
        const auth = getAuthClient();
        if (!auth || !auth.currentUser) throw new Error("No authenticated user");

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
    [handleAuthError, setError]
  );

  const reauthenticateUser = useCallback(
    async (password: string) => {
      try {
        setError(null);
        const auth = getAuthClient();
        if (!auth || !auth.currentUser) throw new Error("No authenticated user");

        const credential = EmailAuthProvider.credential(
          auth.currentUser.email!,
          password
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
      } catch (error) {
        handleAuthError(error);
      }
    },
    [handleAuthError, setError]
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
  }, [applyAuthSnapshot, handleAuthError, setError]);

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
  }, [
    handleAuthError,
    setError,
    setIsSessionExpiring,
    setupSessionTimeouts,
    syncSessionCookieWithServer,
  ]);

  return useMemo(
    () => ({
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
    }),
    [
      deleteUserAccount,
      reauthenticateUser,
      refreshToken,
      reloadUser,
      resetPassword,
      signIn,
      signInWithGitHub,
      signInWithGoogle,
      signInWithGoogleRedirect,
      signInWithMicrosoft,
      signOutUser,
      signUp,
      sendEmailVerificationToUser,
      updateUserEmail,
      updateUserPassword,
      updateUserProfile,
    ]
  );
}
