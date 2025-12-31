import { NextRequest, NextResponse } from "next/server";

type HeadersSource = Pick<Request, "headers"> | { headers: Headers };

const STATIC_ALLOWED_ORIGINS = [
  "https://www.linkedin.com",
  "https://linkedin.com",
  process.env.NEXT_PUBLIC_WEB_URL || "https://hireall.app",
  "https://hireall.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

const ENV_ALLOWED_ORIGINS = (process.env.ALLOWED_CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = new Set(
  [...STATIC_ALLOWED_ORIGINS, ...ENV_ALLOWED_ORIGINS].filter(Boolean),
);

const ALLOWED_DOMAIN_FRAGMENTS = ["hireall.app", "vercel.app", "netlify.app"];

// Extension origin patterns
const EXTENSION_ORIGIN_PATTERNS = [
  /^chrome-extension:\/\/[a-z]{32}$/i, // Chrome extension ID format
  /^moz-extension:\/\/[a-f0-9-]{36}$/i, // Firefox extension ID format
  /^extension:\/\//i, // Generic extension prefix
];

function isExtensionOrigin(origin: string): boolean {
  if (!origin) return false;
  
  const normalized = origin.toLowerCase();
  
  // Check exact prefixes for development
  if (normalized.startsWith('chrome-extension://') || 
      normalized.startsWith('moz-extension://') ||
      normalized.startsWith('extension://')) {
    return true;
  }
  
  // Check against patterns
  return EXTENSION_ORIGIN_PATTERNS.some(pattern => pattern.test(origin));
}

function isAllowedOrigin(origin: string | null | undefined): origin is string {
  if (!origin) {
    return false;
  }

  // Always allow extension origins
  if (isExtensionOrigin(origin)) {
    return true;
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
  /**
   * Max age for preflight cache in seconds (default: 86400 = 24 hours)
   */
  maxAge?: number;
}

const DEFAULT_ALLOW_METHODS = "GET, POST, PUT, DELETE, PATCH, OPTIONS";
const DEFAULT_ALLOW_HEADERS = "Content-Type, Authorization, X-Request-ID, X-HireAll-Request-Id, X-Requested-With, X-Client-Version, X-CSRF-Token, X-Session-Hash, X-Client-Platform";
const DEFAULT_MAX_AGE = 86400; // 24 hours

export function applyCorsHeaders<T extends Response>(
  response: T,
  requestOrOrigin?: NextRequest | HeadersSource | string | null,
  options: ApplyCorsOptions = {},
): T {
  const { 
    allowMethods = DEFAULT_ALLOW_METHODS, 
    allowHeaders = DEFAULT_ALLOW_HEADERS, 
    enableDevWildcard = true,
    maxAge = DEFAULT_MAX_AGE
  } = options;

  let requestOrigin: string | undefined;

  if (typeof requestOrOrigin === "string") {
    requestOrigin = isAllowedOrigin(requestOrOrigin) ? requestOrOrigin : undefined;
  } else if (requestOrOrigin) {
    requestOrigin = resolveOrigin(requestOrOrigin);
  }

  const headers = response.headers;

  // Handle extension origins specifically
  if (requestOrigin && isExtensionOrigin(requestOrigin)) {
    headers.set("Access-Control-Allow-Origin", requestOrigin);
    headers.set("Access-Control-Allow-Methods", allowMethods);
    headers.set("Access-Control-Allow-Headers", allowHeaders);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Max-Age", maxAge.toString());
    headers.set("Vary", "Origin");
    return response;
  }

  if (requestOrigin && requestOrigin !== "*") {
    headers.set("Access-Control-Allow-Origin", requestOrigin);
    headers.set("Access-Control-Allow-Methods", allowMethods);
    headers.set("Access-Control-Allow-Headers", allowHeaders);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Max-Age", maxAge.toString());
    headers.set("Vary", "Origin");
    return response;
  }

  if (process.env.NODE_ENV === "development" && enableDevWildcard) {
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", allowMethods);
    headers.set("Access-Control-Allow-Headers", allowHeaders);
    headers.set("Access-Control-Max-Age", maxAge.toString());
    headers.delete("Access-Control-Allow-Credentials");
  }

  return response;
}

export function preflightResponse(request: NextRequest, options?: ApplyCorsOptions): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return applyCorsHeaders(response, request, options);
}

export function getAllowedOrigin(source: HeadersSource, explicit?: string | null): string | undefined {
  return resolveOrigin(source, explicit);
}

/**
 * Check if the request is from a browser extension
 */
export function isExtensionRequest(request: NextRequest | HeadersSource): boolean {
  const origin = request.headers.get("origin");
  return isExtensionOrigin(origin || "");
}

/**
 * Create a JSON response with CORS headers applied
 */
export function corsJsonResponse<T>(
  data: T,
  request: NextRequest,
  options?: { status?: number; headers?: Record<string, string>; corsOptions?: ApplyCorsOptions }
): NextResponse {
  const { status = 200, headers = {}, corsOptions } = options || {};
  
  const response = NextResponse.json(data, {
    status,
    headers
  });
  
  return applyCorsHeaders(response, request, corsOptions);
}

/**
 * Create an error response with CORS headers applied
 */
export function corsErrorResponse(
  error: string,
  request: NextRequest,
  options?: { status?: number; code?: string; corsOptions?: ApplyCorsOptions }
): NextResponse {
  const { status = 400, code = 'ERROR', corsOptions } = options || {};
  
  return corsJsonResponse(
    { error, code, timestamp: Date.now() },
    request,
    { status, corsOptions }
  );
}
