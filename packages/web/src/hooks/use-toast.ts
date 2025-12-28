"use client";

import { useCallback } from "react";
import { showSuccess, showError, showInfo, showWarning, showLoading, dismissToast } from "@/components/ui/Toast";

interface ToastHook {
  toast: (options: { title?: string; description?: string; variant?: "default" | "destructive" }) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  loading: (message: string) => string | number;
  dismiss: (toastId: string | number) => void;
}

export function useToast(): ToastHook {
  const success = useCallback(showSuccess, []);
  const error = useCallback(showError, []);
  const info = useCallback(showInfo, []);
  const warning = useCallback(showWarning, []);
  const loading = useCallback(showLoading, []);
  const dismiss = useCallback(dismissToast, []);

  const toast = useCallback(({ title, description, variant }: { title?: string; description?: string; variant?: "default" | "destructive" }) => {
    if (variant === "destructive") {
      error(title || "Error", description);
    } else {
      success(title || "Success", description);
    }
  }, [error, success]);

  return {
    toast,
    success,
    error,
    info,
    warning,
    loading,
    dismiss,
  };
}

import { NOTIFICATION_MESSAGES as TOAST_MESSAGES } from "@hireall/shared";
export { TOAST_MESSAGES };

// Helper functions for common toast patterns
export const createToastHelpers = (
  { success, error, loading }: Pick<ToastHook, "success" | "error" | "loading">
) => {
  return {
    // Auth helpers
    showAuthSuccess: (action: 'signin' | 'signup' | 'signout') => {
      const messages = {
        signin: TOAST_MESSAGES.AUTH.SIGN_IN_SUCCESS,
        signup: TOAST_MESSAGES.AUTH.SIGN_UP_SUCCESS,
        signout: TOAST_MESSAGES.AUTH.SIGN_OUT_SUCCESS,
      };
      success(messages[action]);
    },

    showAuthError: (action: 'signin' | 'signup', details?: string) => {
      error(
        TOAST_MESSAGES.AUTH[`SIGN_${action.toUpperCase()}_ERROR` as keyof typeof TOAST_MESSAGES.AUTH],
        details
      );
    },

    // CRUD helpers
    showCrudSuccess: (action: 'create' | 'update' | 'delete', entity: string) => {
      const actionMap = {
        create: TOAST_MESSAGES.GENERIC.CREATED,
        update: TOAST_MESSAGES.GENERIC.UPDATED,
        delete: TOAST_MESSAGES.GENERIC.DELETED,
      };
      success(`${entity} ${actionMap[action].toLowerCase()}`);
    },

    showCrudError: (action: 'create' | 'update' | 'delete', entity: string, details?: string) => {
      error(`Failed to ${action} ${entity}`, details);
    },

    // Loading helpers
    showLoadingState: (operation: string) => {
      return loading(`${operation}...`);
    },

    // Network helpers
    showNetworkError: (details?: string) => {
      error(TOAST_MESSAGES.GENERIC.NETWORK_ERROR, details);
    },

    showValidationError: (field?: string) => {
      const message = field 
        ? `Please check the ${field} field`
        : TOAST_MESSAGES.GENERIC.VALIDATION_ERROR;
      error(message);
    },

    // Success helpers
    showSavedSuccessfully: (item?: string) => {
      const message = item ? `${item} saved successfully!` : TOAST_MESSAGES.GENERIC.SAVED;
      success(message);
    },

    showCopiedToClipboard: (item?: string) => {
      const message = item ? `${item} copied to clipboard!` : TOAST_MESSAGES.GENERIC.COPIED;
      success(message);
    },
  };
};

export const useToastHelpers = () => {
  const toast = useToast();
  return createToastHelpers(toast);
};
