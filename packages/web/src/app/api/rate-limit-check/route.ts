import { NextRequest, NextResponse } from 'next/server';
import { checkServerRateLimitWithAuth, getEndpointFromPath } from '@/lib/rateLimiter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint = 'general' } = body;

    // Get client IP
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') || 
                    'unknown';

    // Get auth token
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    const authToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;

    // Check rate limit with auth
    const rateLimitResult = await checkServerRateLimitWithAuth(clientIP, endpoint, authToken);

    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        resetIn: rateLimitResult.resetIn,
        retryAfter: rateLimitResult.retryAfter,
        maxRequests: rateLimitResult.maxRequests,
        remaining: rateLimitResult.remaining,
        identifier: rateLimitResult.identifier,
      }, { 
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
        }
      });
    }

    return NextResponse.json({
      allowed: true,
      remaining: rateLimitResult.remaining,
      maxRequests: rateLimitResult.maxRequests,
      resetIn: rateLimitResult.resetIn,
      identifier: rateLimitResult.identifier,
    });
  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
