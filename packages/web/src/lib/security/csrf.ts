import { randomBytes, timingSafeEqual, createHash } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const CSRF_COOKIE_NAME = "__csrf-token";
export const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;
const CSRF_MAX_AGE_SECONDS = 60 * 60 * 2; // 2 hours

function generateToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

export function ensureCsrfCookie(
  request: NextRequest,
  response: NextResponse,
): string {
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

  const token = generateToken();
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

  const cookieBuffer = Buffer.from(cookieToken);
  const providedBuffer = Buffer.from(providedToken);

  if (cookieBuffer.length !== providedBuffer.length || !timingSafeEqual(cookieBuffer, providedBuffer)) {
    throw new Error("Invalid CSRF token");
  }
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
