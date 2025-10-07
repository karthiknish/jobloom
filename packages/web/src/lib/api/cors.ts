import { NextRequest, NextResponse } from "next/server";

type HeadersSource = Pick<Request, "headers"> | { headers: Headers };

const STATIC_ALLOWED_ORIGINS = [
  "https://www.linkedin.com",
  "https://linkedin.com",
  process.env.NEXT_PUBLIC_WEB_URL || "https://hireall.app",
  "http://localhost:3000",
];

const ENV_ALLOWED_ORIGINS = (process.env.ALLOWED_CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = new Set(
  [...STATIC_ALLOWED_ORIGINS, ...ENV_ALLOWED_ORIGINS].filter(Boolean),
);

const ALLOWED_DOMAIN_FRAGMENTS = ["hireall.app", "vercel.app", "netlify.app"];

function isAllowedOrigin(origin: string | null | undefined): origin is string {
  if (!origin) {
    return false;
  }

  if (ALLOWED_ORIGINS.has(origin)) {
    return true;
  }

  const normalized = origin.toLowerCase();
  return ALLOWED_DOMAIN_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

function resolveOrigin(source: HeadersSource, explicit?: string | null): string | undefined {
  const directOrigin = explicit || source.headers.get("origin");
  if (isAllowedOrigin(directOrigin)) {
    return directOrigin;
  }

  const referer = source.headers.get("referer");
  if (!referer) {
    return undefined;
  }

  try {
    const refererOrigin = new URL(referer).origin;
    return isAllowedOrigin(refererOrigin) ? refererOrigin : undefined;
  } catch {
    return undefined;
  }
}

interface ApplyCorsOptions {
  /**
   * Override default allowed methods
   */
  allowMethods?: string;
  /**
   * Override default allowed headers
   */
  allowHeaders?: string;
  /**
   * Allow wildcard in development (defaults to true)
   */
  enableDevWildcard?: boolean;
}

const DEFAULT_ALLOW_METHODS = "GET, POST, PUT, DELETE, PATCH, OPTIONS";
const DEFAULT_ALLOW_HEADERS = "Content-Type, Authorization, X-Request-ID, X-Requested-With";

export function applyCorsHeaders<T extends Response>(
  response: T,
  requestOrOrigin?: NextRequest | HeadersSource | string | null,
  options: ApplyCorsOptions = {},
): T {
  const { allowMethods = DEFAULT_ALLOW_METHODS, allowHeaders = DEFAULT_ALLOW_HEADERS, enableDevWildcard = true } = options;

  let requestOrigin: string | undefined;

  if (typeof requestOrOrigin === "string") {
    requestOrigin = isAllowedOrigin(requestOrOrigin) ? requestOrOrigin : undefined;
  } else if (requestOrOrigin) {
    requestOrigin = resolveOrigin(requestOrOrigin);
  }

  const headers = response.headers;

  if (requestOrigin && requestOrigin !== "*") {
    headers.set("Access-Control-Allow-Origin", requestOrigin);
    headers.set("Access-Control-Allow-Methods", allowMethods);
    headers.set("Access-Control-Allow-Headers", allowHeaders);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
    return response;
  }

  if (process.env.NODE_ENV === "development" && enableDevWildcard) {
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", allowMethods);
    headers.set("Access-Control-Allow-Headers", allowHeaders);
    headers.delete("Access-Control-Allow-Credentials");
  }

  return response;
}

export function preflightResponse(request: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return applyCorsHeaders(response, request);
}

export function getAllowedOrigin(source: HeadersSource, explicit?: string | null): string | undefined {
  return resolveOrigin(source, explicit);
}
