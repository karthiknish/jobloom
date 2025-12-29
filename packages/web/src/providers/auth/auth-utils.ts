import { createAuthError as sharedCreateAuthError, AuthError as SharedAuthError } from "@hireall/shared";

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

export type AuthError = SharedAuthError;
export const createAuthError = sharedCreateAuthError;
