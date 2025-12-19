import { NextResponse } from "next/server";
import { withApi, z } from "@/lib/api/withApi";
import { checkServerRateLimitWithAuth } from "@/lib/rateLimiter";

const rateLimitCheckSchema = z.object({
  endpoint: z.string().optional().default('general'),
});

export const POST = withApi({
  auth: 'optional',
  bodySchema: rateLimitCheckSchema,
}, async ({ request, body, user, token }) => {
  const { endpoint } = body;

  // Get client IP
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                  request.headers.get('x-real-ip') || 
                  request.headers.get('cf-connecting-ip') || 
                  'unknown';

  // Check rate limit with auth
  const rateLimitResult = await checkServerRateLimitWithAuth(
    user?.uid || clientIP, 
    endpoint, 
    token || undefined
  );

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

  return {
    allowed: true,
    remaining: rateLimitResult.remaining,
    maxRequests: rateLimitResult.maxRequests,
    resetIn: rateLimitResult.resetIn,
    identifier: rateLimitResult.identifier,
  };
});

