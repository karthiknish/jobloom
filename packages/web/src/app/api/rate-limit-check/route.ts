import { withApi, z } from "@/lib/api/withApi";
import { checkServerRateLimitWithAuth } from "@/lib/rateLimiter";
import { RateLimitError } from "@/lib/api/errorResponse";

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
    throw new RateLimitError(
      'Rate limit exceeded',
      rateLimitResult.retryAfter || 60,
      {
        resetIn: rateLimitResult.resetIn,
        maxRequests: rateLimitResult.maxRequests,
        remaining: rateLimitResult.remaining,
        identifier: rateLimitResult.identifier,
      }
    );
  }

  return {
    allowed: true,
    remaining: rateLimitResult.remaining,
    maxRequests: rateLimitResult.maxRequests,
    resetIn: rateLimitResult.resetIn,
    identifier: rateLimitResult.identifier,
  };
});
