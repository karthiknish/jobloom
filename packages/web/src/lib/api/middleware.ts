// lib/api/middleware.ts - API middleware for common functionality

import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { generateRequestId, ErrorLogger } from "./errors";

// Request context interface
export interface RequestContext {
  requestId: string;
  startTime: number;
  userId?: string;
  userRole?: 'admin' | 'user';
  userAgent?: string;
  ip?: string;
}

// Rate limiting interface
interface RateLimitInfo {
  limit: number;
  windowMs: number;
  current: number;
  resetTime: number;
}

// In-memory rate limit store (in production, use Redis or similar)
const rateLimitStore = new Map<string, RateLimitInfo>();

// Rate limiting middleware
export function createRateLimitMiddleware(options: {
  limit: number;
  windowMs: number;
  keyGenerator?: (req: NextRequest) => string;
}) {
  const { limit, windowMs, keyGenerator = (req) => req.ip || 'unknown' } = options;

  return async (request: NextRequest): Promise<void> => {
    const key = keyGenerator(request);
    const now = Date.now();
    const rateLimitInfo = rateLimitStore.get(key);

    if (!rateLimitInfo || now - rateLimitInfo.resetTime > windowMs) {
      // Reset or initialize rate limit
      rateLimitStore.set(key, {
        limit,
        windowMs,
        current: 1,
        resetTime: now
      });
      return;
    }

    if (rateLimitInfo.current >= limit) {
      const resetIn = Math.ceil((rateLimitInfo.resetTime + windowMs - now) / 1000);
      throw new Error(`Rate limit exceeded. Try again in ${resetIn} seconds.`);
    }

    rateLimitInfo.current++;
  };
}

// Authentication middleware
export async function authenticateRequest(request: NextRequest): Promise<{
  uid: string;
  email?: string;
  name?: string;
  isAdmin?: boolean;
}> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const token = authHeader.substring(7);
  const decodedToken = await verifyIdToken(token);

  if (!decodedToken) {
    throw new Error("Invalid authentication token");
  }

  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    name: decodedToken.name,
    isAdmin: decodedToken.admin || false
  };
}

// Request logging middleware
export function logRequest(request: NextRequest, context: RequestContext): void {
  const logData = {
    requestId: context.requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip: getClientIp(request),
    userId: context.userId,
    timestamp: new Date().toISOString()
  };

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📝 API Request:', logData);
  }

  // TODO: Send to monitoring service in production
}

// Response logging middleware
export function logResponse(response: Response, context: RequestContext): void {
  const logData = {
    requestId: context.requestId,
    status: response.status,
    statusText: response.statusText,
    duration: Date.now() - context.startTime,
    userId: context.userId,
    timestamp: new Date().toISOString()
  };

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📤 API Response:', logData);
  }

  // TODO: Send to monitoring service in production
}

// Get client IP address
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = request.ip;

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return ip || 'unknown';
}

// Create request context
export function createRequestContext(request: NextRequest): RequestContext {
  return {
    requestId: generateRequestId(),
    startTime: Date.now(),
    userAgent: request.headers.get('user-agent') || undefined,
    ip: getClientIp(request)
  };
}

// Security headers middleware
export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  // Add security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Add CORS headers for development
  if (process.env.NODE_ENV === 'development') {
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Content validation middleware
export function validateContentType(request: NextRequest, allowedTypes: string[] = ['application/json']): void {
  const contentType = request.headers.get('content-type');

  if (!contentType && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
    throw new Error(`Content-Type header is required for ${request.method} requests`);
  }

  if (contentType && !allowedTypes.some(type => contentType.includes(type))) {
    throw new Error(`Invalid content type. Expected: ${allowedTypes.join(', ')}`);
  }
}

// Request size validation middleware
export function validateRequestSize(request: NextRequest, maxSizeInBytes: number = 1024 * 1024): void { // 1MB default
  const contentLength = request.headers.get('content-length');

  if (contentLength && parseInt(contentLength) > maxSizeInBytes) {
    throw new Error(`Request body too large. Maximum size is ${maxSizeInBytes / 1024}KB`);
  }
}

// Health check middleware
export function healthCheck(): boolean {
  // Basic health checks
  try {
    // Check Firebase connection (this would be implemented based on your setup)
    // await checkFirebaseConnection();

    // Check database connection
    // await checkDatabaseConnection();

    return true;
  } catch (error) {
    ErrorLogger.log(error, { endpoint: 'health_check' });
    return false;
  }
}

// Compose multiple middleware functions
export function compose(...middlewares: Array<(req: NextRequest, ctx: RequestContext) => Promise<void> | void>) {
  return async (request: NextRequest, context: RequestContext): Promise<void> => {
    for (const middleware of middlewares) {
      await middleware(request, context);
    }
  };
}

// Common middleware combinations
export const commonMiddleware = compose(
  (req: NextRequest, ctx: RequestContext) => validateContentType(req),
  (req: NextRequest, ctx: RequestContext) => validateRequestSize(req),
  (req: NextRequest, ctx: RequestContext) => logRequest(req, ctx)
);

export const authenticatedMiddleware = compose(
  ...commonMiddleware,
  async (req: NextRequest, ctx: RequestContext) => {
    const auth = await authenticateRequest(req);
    ctx.userId = auth.uid;
    ctx.userRole = auth.isAdmin ? 'admin' : 'user';
  }
);

export const adminMiddleware = compose(
  ...authenticatedMiddleware,
  async (req: NextRequest, ctx: RequestContext) => {
    if (ctx.userRole !== 'admin') {
      throw new Error('Admin access required');
    }
  }
);

export const rateLimitedMiddleware = (limit: number, windowMs: number) => compose(
  ...commonMiddleware,
  createRateLimitMiddleware({ limit, windowMs })
);