import type { NextRequest, NextResponse } from "next/server";

export const CSRF_COOKIE_NAME = "__csrf-token";
export const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;
const CSRF_MAX_AGE_SECONDS = 60 * 60 * 2; // 2 hours

async function generateToken(): Promise<string> {
  // Use Web Crypto API for edge runtime compatibility
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(CSRF_TOKEN_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for environments without crypto API
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < CSRF_TOKEN_LENGTH * 2; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function ensureCsrfCookie(
  request: NextRequest,
  response: NextResponse,
): Promise<string> {
  const existing = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (existing) {
    response.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: existing,
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV !== "development",
      maxAge: CSRF_MAX_AGE_SECONDS,
      path: "/",
    });
    return existing;
  }

  const token = await generateToken();
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV !== "development",
    maxAge: CSRF_MAX_AGE_SECONDS,
    path: "/",
  });
  return token;
}

function extractCsrfCandidate(request: NextRequest): string | undefined {
  const header = request.headers.get(CSRF_HEADER_NAME);
  if (header) return header;

  if (request.headers.get("content-type")?.includes("application/json")) {
    const csrfFromHeader = request.headers.get("x-xsrf-token");
    if (csrfFromHeader) return csrfFromHeader;
  }

  const urlToken = request.nextUrl.searchParams.get("_csrf");
  if (urlToken) return urlToken;

  return undefined;
}

export function validateCsrf(request: NextRequest): void {
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return;
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const providedToken = extractCsrfCandidate(request);

  if (!cookieToken || !providedToken) {
    throw new Error("Missing CSRF token");
  }

  // Simple timing-safe comparison for edge runtime compatibility
  if (cookieToken.length !== providedToken.length) {
    throw new Error("Invalid CSRF token");
  }
  
  let result = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ providedToken.charCodeAt(i);
  }
  
  if (result !== 0) {
    throw new Error("Invalid CSRF token");
  }
}

export async function hashSessionToken(token: string): Promise<string> {
  // Use Web Crypto API for edge runtime compatibility
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}
