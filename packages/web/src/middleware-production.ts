import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityConfig, logSecurityEvent } from './lib/security/production';

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

const STATIC_ALLOWED_ORIGINS = [
  "https://www.linkedin.com",
  "https://linkedin.com",
  process.env.NEXT_PUBLIC_WEB_URL || "https://hireall.app",
  "https://hireall.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

const ALLOWED_DOMAIN_FRAGMENTS = ["hireall.app", "vercel.app", "netlify.app"];

function isExtensionOrigin(origin: string): boolean {
  if (!origin) return false;
  const normalized = origin.toLowerCase();
  return normalized.startsWith('chrome-extension://') || 
         normalized.startsWith('moz-extension://') ||
         normalized.startsWith('extension://');
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (isExtensionOrigin(origin)) return true;
  if (STATIC_ALLOWED_ORIGINS.includes(origin)) return true;
  const normalized = origin.toLowerCase();
  return ALLOWED_DOMAIN_FRAGMENTS.some(fragment => normalized.includes(fragment));
}

function applyCorsToResponse(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  
  if (isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin!);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-HireAll-Request-Id, X-Requested-With, X-Client-Version');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400');
    response.headers.set('Vary', 'Origin');
  } else if (process.env.NODE_ENV === 'development') {
    // Allow all origins in development
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-HireAll-Request-Id, X-Requested-With, X-Client-Version');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  return response;
}

/**
 * Production middleware with enhanced security and centralized CORS
 */
export function middleware(request: NextRequest) {
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  
  // Handle CORS preflight requests globally for API routes
  if (isApiRoute && request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return applyCorsToResponse(response, request);
  }

  const response = NextResponse.next();

  // Apply CORS headers to all API responses
  if (isApiRoute) {
    applyCorsToResponse(response, request);
  }

  // Add security headers
  Object.entries(securityConfig.securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Log suspicious requests
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection attempts
    /javascript:/i,  // JavaScript protocol
  ];

  const url = request.url.toLowerCase();
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(url));

  if (isSuspicious) {
    logSecurityEvent('SUSPICIOUS_REQUEST', {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
    });
  }

  // Rate limiting for API routes - implemented via in-memory limiters in individual API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const clientId = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Sample 1% of requests for logging to avoid spam
    if (Math.random() < 0.01) {
      logSecurityEvent('API_REQUEST', {
        path: request.nextUrl.pathname,
        method: request.method,
        ip: clientId,
      });
    }
  }

  // Protect sensitive routes
  const sensitiveRoutes = ['/api/admin/', '/api/users/'];
  const isSensitiveRoute = sensitiveRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isSensitiveRoute) {
    // Add additional security headers for sensitive routes
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    // Log access to sensitive routes
    logSecurityEvent('SENSITIVE_ROUTE_ACCESS', {
      path: request.nextUrl.pathname,
      method: request.method,
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
