import { getEnv } from "./env";

const FALLBACK_WEB_APP_URL = "https://hireall.app";

function normalizeBaseUrl(value: string | undefined, fallback: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }

  const trimmed = value.trim();
  try {
    const hasProtocol = /^https?:\/\//i.test(trimmed);
    const initial = hasProtocol ? trimmed : `https://${trimmed}`;
    let url: URL;
    try {
      url = new URL(initial);
    } catch {
      url = new URL(`http://${trimmed}`);
    }
    const cleanedPath = url.pathname && url.pathname !== "/" ? url.pathname.replace(/\/+$/, "") : "";
    return `${url.protocol}//${url.host}${cleanedPath}`;
  } catch {
    return fallback;
  }
}

const configuredDefault = normalizeBaseUrl(getEnv("WEB_APP_URL"), FALLBACK_WEB_APP_URL);

export const DEFAULT_WEB_APP_URL = configuredDefault;

export function sanitizeBaseUrl(candidate?: string | null): string {
  return normalizeBaseUrl(candidate ?? undefined, DEFAULT_WEB_APP_URL);
}
