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
import { verifySessionFromRequest, verifySessionHashForUser } from "@/lib/auth/session";
import { applyCorsHeaders, preflightResponse, isExtensionRequest } from "./cors";
import { 
  checkServerRateLimitWithAuth, 
  getRateLimitConfig, 
  type RateLimitResult 
} from "@/lib/rateLimiter";
import { validateCsrf } from "@/lib/security/csrf";
import { SecurityLogger } from "@/utils/security";
import { ERROR_CODES, ERROR_MESSAGES, ERROR_STATUS_MAP } from "./errorCodes";
import {
  ValidationError,
  AuthorizationError,
  DatabaseError,
  RateLimitError,
  NetworkError,
  NotFoundError,
  ErrorLogger,
} from "./errorResponse";

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

  /** Apply a default general rate limit when a specific rateLimit key is not provided (default: true) */
  applyGeneralRateLimit?: boolean;
  
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

  /** Whether to skip CSRF validation for this route (e.g. for webhooks) */
  skipCsrf?: boolean;

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
  request: NextRequest,
  options: { isExtension: boolean }
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

  // For extension-origin requests, require a verified session (hash) even when a bearer token is present.
  const isExtensionClient = options.isExtension;

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

  if (isExtensionClient) {
    const sessionHash = request.headers.get("x-session-hash") || request.headers.get("x-session-proof");
    if (!sessionHash) {
      return null;
    }

    const hashValid = await verifySessionHashForUser(decodedToken.uid, sessionHash);
    if (!hashValid) {
      return null;
    }
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
    applyGeneralRateLimit = true,
    corsOptions,
    handler: optionsHandler,
    skipCsrf = false,
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
    const isExtension = isExtensionRequest(request) || request.headers.get("x-client-platform") === "extension";
    
    // Helper to create response with CORS headers
    const respond = (
      body: unknown,
      status: number = 200,
      headers: Record<string, string> = {}
    ): NextResponse => {
      const response = NextResponse.json(body, { status, headers });
      return applyCorsHeaders(response, request, corsOptions);
    };

    // Declare user and token outside try block for access in catch block
    let user: AuthenticatedUser | null = null;
    let token: string | null = null;

    try {
      // 1. Authentication

      if (auth !== 'none') {
        const authResult = await authenticateRequest(request, { isExtension });
        
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

      // 2. CSRF Protection
      if (!skipCsrf && !isExtension && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
        try {
          validateCsrf(request);
        } catch (csrfError) {
          SecurityLogger.logSecurityEvent({
            type: 'suspicious_request',
            ip: getClientIdentifier(request),
            userId: user?.uid,
            severity: 'high',
            details: {
              reason: 'csrf_validation_failed',
              error: csrfError instanceof Error ? csrfError.message : String(csrfError),
              method: request.method,
              url: request.url
            }
          });

          return respond(
            createApiErrorResponse(
              ERROR_CODES.FORBIDDEN,
              "Security validation failed: CSRF token missing or invalid",
              requestId
            ),
            403
          );
        }
      }

      // 3. Rate Limiting
      let rateLimitResult: RateLimitResult | undefined;
      
      const rateLimitKey = rateLimit || (applyGeneralRateLimit ? 'general' : undefined);

      if (rateLimitKey) {
        const identifier = user?.uid || getClientIdentifier(request);
        const authToken = request.headers.get("authorization")?.substring(7);
        
        rateLimitResult = await checkServerRateLimitWithAuth(
          identifier,
          rateLimitKey,
          authToken,
          rateLimitConfig
        );

        if (rateLimitResult && !rateLimitResult.allowed) {
          SecurityLogger.logSecurityEvent({
            type: 'rate_limit_exceeded',
            ip: getClientIdentifier(request),
            userId: user?.uid,
            severity: 'medium',
            details: {
              endpoint: rateLimitKey,
              remaining: 0,
              resetIn: rateLimitResult.resetIn
            }
          });

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

      // 4. Parse and validate query parameters
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

      // 5. Parse and validate request body
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

      // 6. Resolve and validate route params
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

      // 7. Execute handler
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

      // 8. Format response
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
      // Log error with context
      const logContext = {
        endpoint: new URL(request.url).pathname,
        method: request.method,
        userId: user?.uid,
        requestId,
      };

      // Handle ValidationError
      if (error instanceof ValidationError) {
        ErrorLogger.logValidationError(error, logContext);
        return respond(
          createApiErrorResponse(
            error.code || ERROR_CODES.VALIDATION_FAILED,
            error.message,
            requestId,
            { field: error.field }
          ),
          ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_FAILED] || 400
        );
      }

      // Handle AuthorizationError
      if (error instanceof AuthorizationError) {
        ErrorLogger.logAuthError(error, logContext);
        return respond(
          createApiErrorResponse(
            error.code || ERROR_CODES.UNAUTHORIZED,
            error.message,
            requestId
          ),
          ERROR_STATUS_MAP[error.code] || 401
        );
      }

      // Handle DatabaseError
      if (error instanceof DatabaseError) {
        ErrorLogger.logDatabaseError(error, logContext);
        return respond(
          createApiErrorResponse(
            error.code || ERROR_CODES.DATABASE_QUERY_FAILED,
            error.message,
            requestId,
            { details: { operation: error.operation } }
          ),
          ERROR_STATUS_MAP[error.code] || 500
        );
      }

      // Handle RateLimitError
      if (error instanceof RateLimitError) {
        ErrorLogger.logRateLimitError(error, logContext);
        const headers: Record<string, string> = {};
        if (error.retryAfter) {
          headers["Retry-After"] = error.retryAfter.toString();
        }
        return respond(
          createApiErrorResponse(
            ERROR_CODES.RATE_LIMIT_EXCEEDED,
            error.message,
            requestId,
            { retryAfter: error.retryAfter }
          ),
          429,
          headers
        );
      }

      // Handle NetworkError
      if (error instanceof NetworkError) {
        ErrorLogger.logNetworkError(error, logContext);
        return respond(
          createApiErrorResponse(
            ERROR_CODES.THIRD_PARTY_API_ERROR,
            error.message,
            requestId,
            { details: { statusCode: error.statusCode } }
          ),
          error.statusCode || 502
        );
      }

      // Handle NotFoundError
      if (error instanceof NotFoundError) {
        ErrorLogger.log(error, { ...logContext, errorType: 'not_found' });
        return respond(
          createApiErrorResponse(
            error.code || ERROR_CODES.CONTENT_NOT_FOUND,
            error.message,
            requestId,
            { details: { resource: error.resource } }
          ),
          404
        );
      }

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        ErrorLogger.log(error, { ...logContext, errorType: 'validation' });
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
        const errorCode = (error as any).code;
        const isStringCode = typeof errorCode === 'string';
        
        if (error.message.includes("auth/") || error.message.includes("token") || 
            (isStringCode && errorCode.startsWith("auth/"))) {
          ErrorLogger.log(error, { ...logContext, errorType: 'authorization' });
          return respond(
            createApiErrorResponse(
              ERROR_CODES.INVALID_TOKEN,
              "Authentication failed",
              requestId
            ),
            401
          );
        }

        // Check for Firebase database errors
        if (isStringCode && errorCode.startsWith("firestore/")) {
          ErrorLogger.log(error, { ...logContext, errorType: 'database' });
          return respond(
            createApiErrorResponse(
              ERROR_CODES.DATABASE_QUERY_FAILED,
              "Database operation failed",
              requestId
            ),
            500
          );
        }
      }

      // Log unhandled errors
      ErrorLogger.log(error, logContext);

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
