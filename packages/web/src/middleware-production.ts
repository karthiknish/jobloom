import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityConfig, logSecurityEvent } from './lib/security/production';

/**
 * Production middleware with enhanced security
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

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
