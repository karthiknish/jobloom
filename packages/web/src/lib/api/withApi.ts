/**
 * Unified API Route Handler
 * 
 * This module provides a standardized way to create API routes with:
 * - Consistent authentication (optional, required, or admin)
 * - Automatic CORS handling
 * - Standardized error responses
 * - Built-in rate limiting with user tier support
 * - Request validation with Zod schemas
 * - Consistent success/error response format
 * 
 * @example
 * // Simple authenticated route
 * export const GET = withApi({
 *   auth: 'required',
 * }, async ({ user, request }) => {
 *   const data = await getData(user.uid);
 *   return { data };
 * });
 * 
 * @example
 * // Route with validation and rate limiting
 * export const POST = withApi({
 *   auth: 'required',
 *   rateLimit: 'job-add',
 *   bodySchema: createJobSchema,
 * }, async ({ user, body }) => {
 *   const job = await createJob(user.uid, body);
 *   return { job };
 * });
 * 
 * @example
 * // Admin-only route
 * export const DELETE = withApi({
 *   auth: 'admin',
 * }, async ({ user, params }) => {
 *   await deleteResource(params.id);
 *   return { deleted: true };
 * });
 */

import { NextRequest, NextResponse } from "next/server";
import { z, ZodSchema, ZodError } from "zod";
import { verifyIdToken, isUserAdmin, getAdminDb } from "@/firebase/admin";
import { verifySessionFromRequest } from "@/lib/auth/session";
import { applyCorsHeaders, preflightResponse, isExtensionRequest } from "./cors";
import { 
  checkServerRateLimitWithAuth, 
  getRateLimitConfig, 
  type RateLimitResult 
} from "@/lib/rateLimiter";
import { ERROR_CODES, ERROR_MESSAGES, ERROR_STATUS_MAP } from "./errorCodes";

// ============================================================================
// TYPES
// ============================================================================

export type AuthLevel = 'none' | 'optional' | 'required' | 'admin';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
  isAdmin: boolean;
  emailVerified?: boolean;
  tier?: 'free' | 'premium' | 'admin';
}

export interface ApiContext<
  TBody = unknown,
  TQuery = Record<string, string>,
  TParams = Record<string, string>
> {
  request: NextRequest;
  user: AuthenticatedUser | null;
  token: string | null;
  body: TBody;
  query: TQuery;
  params: TParams;
  requestId: string;
  isExtension: boolean;
  rateLimit?: RateLimitResult;
}

export interface ApiOptions<
  TBodySchema extends ZodSchema = ZodSchema,
  TQuerySchema extends ZodSchema = ZodSchema,
  TParamsSchema extends ZodSchema = ZodSchema
> {
  /** Authentication level: 'none', 'optional', 'required', or 'admin' */
  auth?: AuthLevel;
  
  /** Rate limit endpoint key from rateLimiter.ts */
  rateLimit?: string;
  
  /** Custom rate limit config override */
  rateLimitConfig?: {
    maxRequests?: number;
    windowMs?: number;
  };
  
  /** Zod schema for request body validation */
  bodySchema?: TBodySchema;
  
  /** Zod schema for query parameter validation */
  querySchema?: TQuerySchema;

  /** Zod schema for route parameter validation */
  paramsSchema?: TParamsSchema;
  
  /** Custom error messages */
  errorMessages?: {
    unauthorized?: string;
    forbidden?: string;
    rateLimited?: string;
    validationFailed?: string;
  };
  
  /** Whether to include rate limit headers in response */
  includeRateLimitHeaders?: boolean;
  
  /** CORS options */
  corsOptions?: {
    allowMethods?: string;
    allowHeaders?: string;
  };

  /** 
   * Optional handler for single-argument usage.
   * Prefer passing handler as the second argument for better type inference.
   */
  handler?: ApiHandler<any, any, any, any>;
}

export type ApiHandler<
  TBody = unknown,
  TQuery = Record<string, string>,
  TParams = Record<string, string>,
  TResponse = unknown
> = (
  context: ApiContext<TBody, TQuery, TParams>
) => Promise<TResponse | NextResponse> | TResponse | NextResponse;

export type RouteParams<T = Record<string, string>> = { params: Promise<T> };

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    requestId: string;
    timestamp: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    field?: string;
    retryAfter?: number;
  };
  meta: {
    requestId: string;
    timestamp: number;
  };
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function createApiSuccessResponse<T>(
  data: T,
  requestId: string,
  message?: string,
  meta?: Record<string, unknown>
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    meta: {
      requestId,
      timestamp: Date.now(),
      ...meta,
    },
  };
}

function createApiErrorResponse(
  code: string,
  message: string,
  requestId: string,
  options?: {
    details?: Record<string, unknown>;
    field?: string;
    retryAfter?: number;
  }
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...options,
    },
    meta: {
      requestId,
      timestamp: Date.now(),
    },
  };
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

const MOCK_SIGNATURE = "bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc";

function isMockToken(token: string): boolean {
  return process.env.NODE_ENV === "development" && token.includes(MOCK_SIGNATURE);
}

function getMockUser(): AuthenticatedUser {
  return {
    uid: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    isAdmin: false,
    emailVerified: true,
    tier: "free",
  };
}

// User tier cache for performance
const userTierCache = new Map<string, { tier: 'free' | 'premium' | 'admin'; expiresAt: number }>();
const USER_TIER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getUserTier(uid: string): Promise<'free' | 'premium' | 'admin'> {
  const cached = userTierCache.get(uid);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tier;
  }
  
  try {
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();
    
    let tier: 'free' | 'premium' | 'admin' = 'free';
    if (userData?.isAdmin) {
      tier = 'admin';
    } else if (userData?.subscription?.tier === 'premium' || userData?.subscription?.status === 'active') {
      tier = 'premium';
    }
    
    userTierCache.set(uid, { tier, expiresAt: Date.now() + USER_TIER_CACHE_TTL });
    return tier;
  } catch (error) {
    console.error("Error fetching user tier:", error);
    return cached?.tier || 'free';
  }
}

async function authenticateRequest(
  request: NextRequest
): Promise<{ user: AuthenticatedUser; token: string } | null> {
  // Try session-based auth first
  try {
    const sessionClaims = await verifySessionFromRequest(request);
    if (sessionClaims) {
      const tier = await getUserTier(sessionClaims.uid);
      return {
        user: {
          uid: sessionClaims.uid,
          email: sessionClaims.email,
          name: (sessionClaims as Record<string, unknown>).name as string | undefined,
          isAdmin: tier === 'admin',
          emailVerified: sessionClaims.email_verified,
          tier,
        },
        token: "session",
      };
    }
  } catch {
    // Session verification failed, try Bearer token
  }

  // Try Bearer token auth
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  // Handle mock token in development
  if (isMockToken(token)) {
    return { user: getMockUser(), token };
  }

  // Verify Firebase token
  const decodedToken = await verifyIdToken(token);
  if (!decodedToken) {
    return null;
  }

  const tier = await getUserTier(decodedToken.uid);
  const isAdmin = tier === 'admin' || await isUserAdmin(decodedToken.uid);

  return {
    user: {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      isAdmin,
      emailVerified: decodedToken.email_verified,
      tier: isAdmin ? 'admin' : tier,
    },
    token,
  };
}

// ============================================================================
// RATE LIMITING
// ============================================================================

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0].trim() || realIp || "unknown";
}

// ============================================================================
// VALIDATION
// ============================================================================

function parseQueryParams<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): z.infer<T> {
  const url = new URL(request.url);
  const rawParams: Record<string, string | undefined> = {};
  
  url.searchParams.forEach((value, key) => {
    rawParams[key] = value;
  });

  return schema.parse(rawParams);
}

async function parseBody<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  const body = await request.json();
  return schema.parse(body);
}

// ============================================================================
// MAIN WRAPPER
// ============================================================================

export function withApi<
  TBodySchema extends ZodSchema = ZodSchema<unknown>,
  TQuerySchema extends ZodSchema = ZodSchema<Record<string, string>>,
  TParamsSchema extends ZodSchema = ZodSchema<Record<string, string>>,
  TResponse = unknown
>(
  options: ApiOptions<TBodySchema, TQuerySchema, TParamsSchema>,
  handler?: ApiHandler<
    z.infer<TBodySchema>,
    z.infer<TQuerySchema>,
    z.infer<TParamsSchema>,
    TResponse
  >
) {
  const {
    auth = 'none',
    rateLimit,
    rateLimitConfig,
    bodySchema,
    querySchema,
    paramsSchema,
    errorMessages = {},
    includeRateLimitHeaders = true,
    corsOptions,
    handler: optionsHandler,
  } = options;

  const actualHandler = handler || (optionsHandler as ApiHandler<
    z.infer<TBodySchema>,
    z.infer<TQuerySchema>,
    z.infer<TParamsSchema>,
    TResponse
  >);

  if (!actualHandler) {
    throw new Error("withApi: No handler provided. Pass it as the second argument or as a 'handler' property in the options object.");
  }

  return async (
    request: NextRequest,
    routeContext?: RouteParams<Record<string, string>>
  ): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const isExtension = isExtensionRequest(request);
    
    // Helper to create response with CORS headers
    const respond = (
      body: unknown,
      status: number = 200,
      headers: Record<string, string> = {}
    ): NextResponse => {
      const response = NextResponse.json(body, { status, headers });
      return applyCorsHeaders(response, request, corsOptions);
    };

    try {
      // 1. Authentication
      let user: AuthenticatedUser | null = null;
      let token: string | null = null;

      if (auth !== 'none') {
        const authResult = await authenticateRequest(request);
        
        if (auth === 'required' || auth === 'admin') {
          if (!authResult) {
            return respond(
              createApiErrorResponse(
                ERROR_CODES.UNAUTHORIZED,
                errorMessages.unauthorized || ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED],
                requestId
              ),
              401
            );
          }
        }

        if (auth === 'admin') {
          if (!authResult?.user.isAdmin) {
            return respond(
              createApiErrorResponse(
                ERROR_CODES.FORBIDDEN,
                errorMessages.forbidden || "Admin access required",
                requestId
              ),
              403
            );
          }
        }

        if (authResult) {
          user = authResult.user;
          token = authResult.token;
        }
      }

      // 2. Rate Limiting
      let rateLimitResult: RateLimitResult | undefined;
      
      if (rateLimit) {
        const identifier = user?.uid || getClientIdentifier(request);
        const authToken = request.headers.get("authorization")?.substring(7);
        
        rateLimitResult = await checkServerRateLimitWithAuth(
          identifier,
          rateLimit,
          authToken,
          rateLimitConfig
        );

        if (!rateLimitResult.allowed) {
          const headers: Record<string, string> = {};
          if (includeRateLimitHeaders) {
            headers["X-RateLimit-Remaining"] = "0";
            headers["X-RateLimit-Reset"] = (rateLimitResult.resetIn || 0).toString();
            headers["Retry-After"] = (rateLimitResult.retryAfter || 60).toString();
          }

          return respond(
            createApiErrorResponse(
              ERROR_CODES.RATE_LIMIT_EXCEEDED,
              errorMessages.rateLimited || "Rate limit exceeded. Please try again later.",
              requestId,
              { retryAfter: rateLimitResult.retryAfter }
            ),
            429,
            headers
          );
        }
      }

      // 3. Parse and validate query parameters
      let query: z.infer<TQuerySchema> = {} as z.infer<TQuerySchema>;
      if (querySchema) {
        try {
          query = parseQueryParams(request, querySchema);
        } catch (error) {
          if (error instanceof ZodError) {
            const firstError = error.issues[0];
            return respond(
              createApiErrorResponse(
                ERROR_CODES.VALIDATION_FAILED,
                errorMessages.validationFailed || firstError?.message || "Invalid query parameters",
                requestId,
                {
                  field: firstError?.path.join("."),
                  details: { validationErrors: error.issues },
                }
              ),
              400
            );
          }
          throw error;
        }
      }

      // 4. Parse and validate request body
      let body: z.infer<TBodySchema> = undefined as z.infer<TBodySchema>;
      if (bodySchema && ["POST", "PUT", "PATCH"].includes(request.method)) {
        try {
          body = await parseBody(request, bodySchema);
        } catch (error) {
          if (error instanceof ZodError) {
            const firstError = error.issues[0];
            return respond(
              createApiErrorResponse(
                ERROR_CODES.VALIDATION_FAILED,
                errorMessages.validationFailed || firstError?.message || "Invalid request body",
                requestId,
                {
                  field: firstError?.path.join("."),
                  details: { validationErrors: error.issues },
                }
              ),
              400
            );
          }
          
          // JSON parse error
          if (error instanceof SyntaxError) {
            return respond(
              createApiErrorResponse(
                ERROR_CODES.INVALID_JSON,
                "Invalid JSON in request body",
                requestId
              ),
              400
            );
          }
          
          throw error;
        }
      }

      // 5. Resolve and validate route params
      let params: z.infer<TParamsSchema> = (routeContext?.params 
        ? await routeContext.params 
        : {}) as z.infer<TParamsSchema>;

      if (paramsSchema) {
        try {
          params = paramsSchema.parse(params);
        } catch (error) {
          if (error instanceof ZodError) {
            const firstError = error.issues[0];
            return respond(
              createApiErrorResponse(
                ERROR_CODES.VALIDATION_FAILED,
                errorMessages.validationFailed || firstError?.message || "Invalid route parameters",
                requestId,
                {
                  field: firstError?.path.join("."),
                  details: { validationErrors: error.issues },
                }
              ),
              400
            );
          }
          throw error;
        }
      }

      // 6. Execute handler
      const context: ApiContext<
        z.infer<TBodySchema>,
        z.infer<TQuerySchema>,
        z.infer<TParamsSchema>
      > = {
        request,
        user,
        token,
        body,
        query,
        params,
        requestId,
        isExtension,
        rateLimit: rateLimitResult,
      };

      const result = await actualHandler(context);

      // 7. Format response
      if (result instanceof NextResponse) {
        // Handler returned a raw NextResponse, apply CORS
        return applyCorsHeaders(result, request, corsOptions);
      }

      // Wrap result in standard success response
      const responseHeaders: Record<string, string> = {};
      if (includeRateLimitHeaders && rateLimitResult) {
        responseHeaders["X-RateLimit-Remaining"] = (rateLimitResult.remaining || 0).toString();
        responseHeaders["X-RateLimit-Reset"] = (rateLimitResult.resetIn || 0).toString();
      }

      return respond(
        createApiSuccessResponse(result, requestId),
        200,
        responseHeaders
      );

    } catch (error) {
      // Catch-all error handler
      console.error(`[API Error] ${requestId}:`, error);

      // Handle known error types
      if (error instanceof ZodError) {
        return respond(
          createApiErrorResponse(
            ERROR_CODES.VALIDATION_FAILED,
            "Validation error",
            requestId,
            { details: { validationErrors: error.issues } }
          ),
          400
        );
      }

      // Check for Firebase auth errors
      if (error instanceof Error) {
        if (error.message.includes("auth/") || error.message.includes("token")) {
          return respond(
            createApiErrorResponse(
              ERROR_CODES.INVALID_TOKEN,
              "Authentication failed",
              requestId
            ),
            401
          );
        }
      }

      // Generic internal error
      const message = process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "An unexpected error occurred";

      return respond(
        createApiErrorResponse(
          ERROR_CODES.INTERNAL_SERVER_ERROR,
          message,
          requestId
        ),
        500
      );
    }
  };
}

// ============================================================================
// PREFLIGHT HANDLER
// ============================================================================

/**
 * Standard OPTIONS handler for CORS preflight requests.
 * Export this as your OPTIONS handler in API routes.
 * 
 * @example
 * export { OPTIONS } from '@/lib/api/withApi';
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return preflightResponse(request);
}

// ============================================================================
// CONVENIENCE WRAPPERS
// ============================================================================

/**
 * Create a public API route (no authentication required)
 */
export function withPublicApi<
  TBodySchema extends ZodSchema = ZodSchema<unknown>,
  TQuerySchema extends ZodSchema = ZodSchema<Record<string, string>>,
  TParamsSchema extends ZodSchema = ZodSchema<Record<string, string>>,
  TResponse = unknown
>(
  options: Omit<ApiOptions<TBodySchema, TQuerySchema, TParamsSchema>, 'auth'>,
  handler?: ApiHandler<
    z.infer<TBodySchema>,
    z.infer<TQuerySchema>,
    z.infer<TParamsSchema>,
    TResponse
  >
) {
  return withApi({ ...options, auth: 'none' } as ApiOptions<TBodySchema, TQuerySchema, TParamsSchema>, handler);
}

/**
 * Create an authenticated API route (auth required)
 */
export function withAuthenticatedApi<
  TBodySchema extends ZodSchema = ZodSchema<unknown>,
  TQuerySchema extends ZodSchema = ZodSchema<Record<string, string>>,
  TParamsSchema extends ZodSchema = ZodSchema<Record<string, string>>,
  TResponse = unknown
>(
  options: Omit<ApiOptions<TBodySchema, TQuerySchema, TParamsSchema>, 'auth'>,
  handler?: ApiHandler<
    z.infer<TBodySchema>,
    z.infer<TQuerySchema>,
    z.infer<TParamsSchema>,
    TResponse
  >
) {
  return withApi({ ...options, auth: 'required' } as ApiOptions<TBodySchema, TQuerySchema, TParamsSchema>, handler);
}

/**
 * Create an admin-only API route
 */
export function withAdminApi<
  TBodySchema extends ZodSchema = ZodSchema<unknown>,
  TQuerySchema extends ZodSchema = ZodSchema<Record<string, string>>,
  TParamsSchema extends ZodSchema = ZodSchema<Record<string, string>>,
  TResponse = unknown
>(
  options: Omit<ApiOptions<TBodySchema, TQuerySchema, TParamsSchema>, 'auth'>,
  handler?: ApiHandler<
    z.infer<TBodySchema>,
    z.infer<TQuerySchema>,
    z.infer<TParamsSchema>,
    TResponse
  >
) {
  return withApi({ ...options, auth: 'admin' } as ApiOptions<TBodySchema, TQuerySchema, TParamsSchema>, handler);
}

// Re-export commonly used types and utilities
export { z } from "zod";
export type { ZodSchema } from "zod";
