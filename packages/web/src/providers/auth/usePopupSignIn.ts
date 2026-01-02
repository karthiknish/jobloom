import { useCallback, useRef } from "react";
import {
  ensureFirebaseApp,
  getAuthClient,
  getGoogleProvider,
} from "@/firebase/client";
import { showError, showSuccess } from "@/components/ui/Toast";
import {
  GithubAuthProvider,
  OAuthProvider,
  signInWithPopup,
  type AuthProvider,
} from "firebase/auth";
import { delay } from "./auth-utils";

export type PopupProviderKey = "google" | "github" | "microsoft";

interface PopupState {
  locked: boolean;
  retryCount: number;
}

export interface RunPopupSignInOptions {
  successMessage: string;
  retryOnEarlyClose?: boolean;
  beforeAttempt?: () => void;
}

export function usePopupSignIn() {
  const popupStatesRef = useRef<Record<PopupProviderKey, PopupState>>({
    google: { locked: false, retryCount: 0 },
    github: { locked: false, retryCount: 0 },
    microsoft: { locked: false, retryCount: 0 },
  });

  const runPopupSignIn = useCallback(
    async <T extends AuthProvider>(
      key: PopupProviderKey,
      providerFactory: () => T | undefined,
      options: RunPopupSignInOptions
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
            if (options.successMessage) {
              showSuccess(options.successMessage);
            }
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

  return { runPopupSignIn };
}

export const createGooglePopupProvider = () => getGoogleProvider();

export const createGithubPopupProvider = () => {
  const provider = new GithubAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
};

export const createMicrosoftPopupProvider = () => {
  const provider = new OAuthProvider("microsoft.com");
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
};

export type RunPopupSignIn = ReturnType<typeof usePopupSignIn>["runPopupSignIn"];
