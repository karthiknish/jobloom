export const LAST_AUTH_METHOD_KEY = "hireall_last_auth_method";

export const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const storeLastAuthMethod = (method: string) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(LAST_AUTH_METHOD_KEY, method);
  } catch (error) {
    console.warn("Failed to store last auth method:", error);
  }
};

export const getLastAuthMethod = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(LAST_AUTH_METHOD_KEY);
  } catch (error) {
    console.warn("Failed to get last auth method:", error);
    return null;
  }
};

export const CSRF_HEADER_NAME = "x-csrf-token";
export const CSRF_COOKIE_NAME = "__csrf-token";

export const getCookieValue = (name: string): string | undefined => {
  if (typeof document === "undefined") {
    return undefined;
  }

  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const cookie of cookies) {
    const [rawName, ...rest] = cookie.trim().split("=");
    if (rawName === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return undefined;
};

export interface AuthError {
  code: string;
  message: string;
  userMessage: string;
}

const DEFAULT_AUTH_ERROR_MESSAGE =
  "An error occurred during authentication. Please try again.";

const sanitizeAuthMessage = (message?: string): string => {
  if (!message) {
    return DEFAULT_AUTH_ERROR_MESSAGE;
  }

  let cleaned = message.replace(/^Firebase:\s*/i, "").trim();
  cleaned = cleaned.replace(/^Error\s*/i, "").trim();
  cleaned = cleaned.replace(/\([^)]*\)/g, "").trim();

  if (!cleaned) {
    return DEFAULT_AUTH_ERROR_MESSAGE;
  }

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

export const createAuthError = (error: any): AuthError => {
  const code = error?.code || "auth/unknown-error";
  const sanitizedMessage = sanitizeAuthMessage(error?.message);
  const userMessage = AUTH_ERRORS[code] || sanitizedMessage;

  return { code, message: sanitizedMessage, userMessage };
};
