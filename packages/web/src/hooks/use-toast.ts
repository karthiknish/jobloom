"use client";

import { useCallback } from "react";
import { showSuccess, showError, showInfo, showWarning, showLoading, dismissToast } from "@/components/ui/Toast";

interface ToastHook {
  toast: (options: { title?: string; description?: string; variant?: "default" | "destructive" }) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  loading: (message: string) => string;
  dismiss: (toastId: string) => void;
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

// Toast messages for different contexts
export const TOAST_MESSAGES = {
  // Authentication messages
  AUTH: {
    SIGN_IN_SUCCESS: "Successfully signed in!",
    SIGN_OUT_SUCCESS: "Successfully signed out!",
    SIGN_IN_ERROR: "Failed to sign in. Please check your credentials.",
    SIGN_UP_SUCCESS: "Account created successfully!",
    SIGN_UP_ERROR: "Failed to create account. Please try again.",
    SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  },

  // Settings messages
  SETTINGS: {
    PROFILE_SAVED: "Profile updated successfully!",
    PREFERENCES_SAVED: "Preferences saved successfully!",
    PASSWORD_CHANGED: "Password changed successfully!",
    SETTINGS_ERROR: "Failed to save settings. Please try again.",
    AVATAR_UPLOADED: "Profile picture updated successfully!",
    AVATAR_ERROR: "Failed to upload profile picture.",
  },

  // Job management messages
  JOBS: {
    CREATED: "Job added successfully!",
    UPDATED: "Job updated successfully!",
    DELETED: "Job deleted successfully!",
    BULK_UPDATED: "Jobs updated successfully!",
    IMPORT_STARTED: "Job import started. This may take a moment.",
    IMPORT_SUCCESS: "Jobs imported successfully!",
    IMPORT_ERROR: "Failed to import jobs. Please check the file format.",
    IMPORT_PARTIAL: "Some jobs were imported successfully.",
  },

  // Application management messages
  APPLICATIONS: {
    CREATED: "Application added successfully!",
    UPDATED: "Application updated successfully!",
    DELETED: "Application deleted successfully!",
    STATUS_CHANGED: "Application status updated successfully!",
    BULK_UPDATED: "Applications updated successfully!",
    FOLLOW_UP_SET: "Follow-up reminder set successfully!",
    FOLLOW_UP_REMOVED: "Follow-up reminder removed successfully!",
  },

  // CV/Resume messages
  CV: {
    UPLOAD_SUCCESS: "Resume uploaded successfully!",
    ANALYSIS_STARTED: "Resume analysis started. This may take a moment.",
    ANALYSIS_COMPLETE: "Resume analysis complete!",
    ANALYSIS_ERROR: "Failed to analyze resume. Please try again.",
    IMPROVEMENTS_GENERATED: "Resume improvements generated successfully!",
    DOWNLOAD_SUCCESS: "Resume downloaded successfully!",
    DOWNLOAD_ERROR: "Failed to download resume.",
  },

  // Dashboard messages
  DASHBOARD: {
    LOADING: "Loading dashboard data...",
    DATA_REFRESHED: "Dashboard data refreshed successfully!",
    WIDGET_UPDATED: "Widget updated successfully!",
    LAYOUT_SAVED: "Dashboard layout saved successfully!",
  },

  // Extension messages
  EXTENSION: {
    INSTALLED: "Chrome extension detected and connected!",
    NOT_INSTALLED: "Chrome extension not detected. Please install it for automatic job detection.",
    SYNC_SUCCESS: "Jobs synced successfully from extension!",
    SYNC_ERROR: "Failed to sync jobs from extension.",
    CONNECTION_LOST: "Lost connection to Chrome extension.",
  },

  // Subscription messages
  SUBSCRIPTION: {
    UPGRADE_SUCCESS: "Successfully upgraded to Premium!",
    DOWNGRADE_SUCCESS: "Successfully changed your plan.",
    PAYMENT_SUCCESS: "Payment processed successfully!",
    PAYMENT_ERROR: "Payment failed. Please try again.",
    CANCELLED: "Subscription cancelled successfully.",
    REACTIVATED: "Subscription reactivated successfully!",
  },

  // Generic messages
  GENERIC: {
    LOADING: "Loading...",
    SUCCESS: "Operation completed successfully!",
    ERROR: "Something went wrong. Please try again.",
    NETWORK_ERROR: "Network error. Please check your connection.",
    UNAUTHORIZED: "You don't have permission to perform this action.",
    NOT_FOUND: "The requested resource was not found.",
    SERVER_ERROR: "Server error. Please try again later.",
    VALIDATION_ERROR: "Please check your input and try again.",
    SAVED: "Changes saved successfully!",
    DELETED: "Item deleted successfully!",
    COPIED: "Copied to clipboard!",
    UPDATED: "Updated successfully!",
    CREATED: "Created successfully!",
  },

  // File operations
  FILES: {
    UPLOAD_SUCCESS: "File uploaded successfully!",
    UPLOAD_ERROR: "Failed to upload file. Please check the file format and size.",
    DELETE_SUCCESS: "File deleted successfully!",
    DOWNLOAD_SUCCESS: "File downloaded successfully!",
    EXPORT_SUCCESS: "Data exported successfully!",
    IMPORT_SUCCESS: "Data imported successfully!",
  },

  // Search and filter messages
  SEARCH: {
    NO_RESULTS: "No results found for your search.",
    FILTERS_APPLIED: "Filters applied successfully!",
    FILTERS_CLEARED: "Filters cleared successfully!",
    SEARCH_COMPLETE: "Search complete!",
  },

  // Collaboration messages
  COLLABORATION: {
    INVITED: "Invitation sent successfully!",
    ACCEPTED: "Invitation accepted successfully!",
    DECLINED: "Invitation declined.",
    REMOVED: "Access removed successfully!",
    PERMISSIONS_UPDATED: "Permissions updated successfully!",
  },
} as const;

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
