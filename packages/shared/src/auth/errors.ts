/**
 * Shared Authentication Errors and Utilities
 */

export interface AuthError {
  code: string;
  message: string;
  userMessage: string;
}

export const AUTH_ERRORS: Record<string, string> = {
  "auth/user-disabled": "Your account has been disabled. Please contact support.",
  "auth/user-not-found": "No account found with this email address.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password should be at least 6 characters long.",
  "auth/operation-not-allowed": "This sign-in method is not enabled.",
  "auth/account-exists-with-different-credential": "An account already exists with the same email but different sign-in credentials.",
  "auth/invalid-credential": "Invalid credentials. Please try again.",
  "auth/credential-already-in-use": "This credential is already associated with a different user account.",
  "auth/timeout": "The operation has timed out. Please try again.",
  "auth/network-request-failed": "Network error. Please check your connection and try again.",
  "auth/too-many-requests": "Too many failed attempts. Please try again later.",
  "auth/requires-recent-login": "This operation requires recent authentication. Please sign in again.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/popup-blocked": "Sign-in popup was blocked by your browser.",
  "auth/popup-closed-by-user": "Sign-in popup was closed before completing.",
  "auth/popup-already-in-progress": "Another sign-in window is already open. Please finish it before starting a new one.",
  "auth/web-storage-unsupported": "Browser storage is blocked. Enable cookies or switch to a different browser.",
  "auth/operation-not-supported-in-this-environment": "This browser does not support popup sign-in. Please try a different browser or use the email option instead.",
  "auth/internal-error": "Something went wrong while contacting Google. Please try again.",
};

const DEFAULT_AUTH_ERROR_MESSAGE = "An error occurred during authentication. Please try again.";

export function sanitizeAuthMessage(message?: string): string {
  if (!message) return DEFAULT_AUTH_ERROR_MESSAGE;

  let cleaned = message.replace(/^Firebase:\s*/i, "").trim();
  cleaned = cleaned.replace(/^Error\s*/i, "").trim();
  cleaned = cleaned.replace(/\([^)]*\)/g, "").trim();

  if (!cleaned) return DEFAULT_AUTH_ERROR_MESSAGE;

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function createAuthError(error: any): AuthError {
  const code = error?.code || "auth/unknown-error";
  const sanitizedMessage = sanitizeAuthMessage(error?.message);
  const userMessage = AUTH_ERRORS[code] || sanitizedMessage;

  return { code, message: sanitizedMessage, userMessage };
}
