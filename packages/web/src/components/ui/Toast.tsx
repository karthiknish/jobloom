"use client";

import { toast } from "sonner";
import { humanizeError } from "@/utils/errorMessages";

const DEFAULT_ERROR_MESSAGE = "We couldn't complete that request. Please try again.";

const ERROR_CODE_MESSAGES: Record<string, string> = {
  "auth/popup-closed-by-user": "You closed the sign-in window before it finished.",
  "auth/network-request-failed": "Network error. Please check your connection and try again.",
  "auth/cancelled-popup-request": "Another sign-in is already in progress.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups and try again.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment before trying again.",
  "auth/user-disabled": "Your account has been disabled. Contact support for help.",
  "auth/user-not-found": "We couldn't find an account with those details.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "firestore/permission-denied": "You don't have permission to perform that action.",
  "firestore/not-found": "We couldn't find the data you requested.",
  "firestore/unavailable": "The service is temporarily unavailable. Please try again shortly.",
};

const sanitizeMessage = (message?: string): string => {
  if (!message) return DEFAULT_ERROR_MESSAGE;

  const trimmed = message.trim();

  // If message includes a Firebase prefix, remove it and map friendly text
  if (/^firebase:/i.test(trimmed)) {
    let withoutPrefix = trimmed.replace(/^firebase:\s*/i, "").trim();
    withoutPrefix = withoutPrefix.replace(/^error\s*/i, "").trim();

    const codeMatch = withoutPrefix.match(/\(([^)]+)\)/);
    if (codeMatch?.[1]) {
      const code = codeMatch[1];
      if (ERROR_CODE_MESSAGES[code]) {
        return ERROR_CODE_MESSAGES[code];
      }
    }

    // Remove any remaining code notation like (auth/xxx)
    withoutPrefix = withoutPrefix.replace(/\([^)]*\)/g, "").trim();
    if (withoutPrefix) {
      return withoutPrefix.charAt(0).toUpperCase() + withoutPrefix.slice(1);
    }
    return DEFAULT_ERROR_MESSAGE;
  }

  return trimmed;
};

// Centralized toast functions with user-friendly messages
export const showSuccess = (message: string, description?: string) =>
  toast.success(message, { description });

export const showError = (message: string, description?: string) => {
  // Handle empty/undefined messages
  if (!message || message.trim() === "") {
    toast.error(DEFAULT_ERROR_MESSAGE, { description });
    return;
  }
  
  // Use humanizeError for comprehensive pattern matching
  const humanized = humanizeError(message);
  // Fall back to existing sanitization if humanizeError returns default
  const finalMessage = humanized !== "Something went wrong. Please try again." 
    ? humanized 
    : sanitizeMessage(message);
    
  // Final safeguard - never show empty toast
  const displayMessage = finalMessage?.trim() || DEFAULT_ERROR_MESSAGE;
  
  toast.error(displayMessage, { 
    description: description ? sanitizeMessage(description) : undefined 
  });
};

export const showInfo = (message: string, description?: string) =>
  toast.info(message, { description });

export const showWarning = (message: string, description?: string) =>
  toast.warning(message, { description });

export const showLoading = (message: string) =>
  toast.loading(message);

export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};

/**
 * Show a success toast with an Undo action button
 * @param message - The toast message
 * @param description - Optional description
 * @param onUndo - Callback function when Undo is clicked
 * @param duration - How long the toast stays visible (default: 8000ms)
 */
export const showUndoableSuccess = (
  message: string, 
  options: {
    description?: string;
    onUndo: () => void | Promise<void>;
    duration?: number;
  }
) => {
  const { description, onUndo, duration = 8000 } = options;
  
  toast.success(message, {
    description,
    duration,
    action: {
      label: "Undo",
      onClick: async () => {
        try {
          await onUndo();
          toast.success("Action undone");
        } catch (error) {
          console.error("Undo failed:", error);
          toast.error("Failed to undo action");
        }
      },
    },
  });
};

// Re-export AppToaster for backward compatibility - now uses Sonner
export { Toaster as AppToaster } from "@/components/ui/sonner";
