import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkServerRateLimit, getEndpointFromPath, cleanupExpiredServerLimits } from "./lib/rateLimiter";

// Clean up expired limits every 5 minutes
setInterval(cleanupExpiredServerLimits, 5 * 60 * 1000);

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
    const endpoint = getEndpointFromPath(pathname);
    const rateLimitResult = checkServerRateLimit(clientIP, endpoint);
    
    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({ 
          error: `Rate limit exceeded for ${endpoint}. Try again in ${Math.ceil((rateLimitResult.resetIn || 0) / 1000)} seconds.`,
          endpoint,
          resetTime: rateLimitResult.resetIn
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': (rateLimitResult.maxRequests || 0).toString(),
            'X-RateLimit-Remaining': (rateLimitResult.remaining || 0).toString(),
            'X-RateLimit-Reset': (rateLimitResult.resetIn || 0).toString()
          }
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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};