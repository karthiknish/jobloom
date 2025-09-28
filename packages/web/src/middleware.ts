import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiting store (for production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window per IP

// Security headers configuration (additional headers are now in next.config.ts)
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

function getClientIP(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  return cfConnectingIP || realIP || forwarded?.split(',')[0] || 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  record.count++;
  return false;
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add CORS headers for API routes
  if (response.headers.get('content-type')?.includes('application/json')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' ? 'https://hireall.app' : 'http://localhost:3000');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);
  const host = request.headers.get('host') || '';

  // Subdomain routing: {sub}.hireall.app -> /p/[sub]
  // In development localhost:3000 treat pattern {sub}.localhost:3000
  const isLocal = host.includes('localhost');
  const rootDomain = isLocal ? 'localhost:3000' : 'hireall.app';
  if (host.endsWith(rootDomain)) {
    const sub = host.replace('.' + rootDomain, '');
    if (sub && sub !== 'www' && sub !== rootDomain) {
      // Avoid rewriting API/static/image paths
      if (!pathname.startsWith('/api') && !pathname.startsWith('/_next') && pathname === '/') {
        const url = request.nextUrl.clone();
        url.pathname = `/p/${sub}`; // dynamic public portfolio route
        return applySecurityHeaders(NextResponse.rewrite(url));
      }
    }
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    if (isRateLimited(clientIP)) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
        }
      );
    }
  }

  // Define protected routes that require authentication
  const protectedRoutes = [
    "/dashboard",
    "/account",
    "/admin"
  ];

  // Define auth routes that should redirect to dashboard if already authenticated
  const authRoutes = ["/sign-in", "/sign-up"];

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Check for authentication token in cookies
  const hasAuthToken = request.cookies.has("__firebase_user");

  // Handle protected routes
  if (isProtectedRoute && !hasAuthToken) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", pathname);
    const response = NextResponse.redirect(signInUrl);
    return applySecurityHeaders(response);
  }

  // Handle auth routes when already authenticated
  if (isAuthRoute && hasAuthToken) {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    return applySecurityHeaders(response);
  }

  // Apply security headers to all responses
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};