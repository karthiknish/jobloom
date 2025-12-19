import { z } from 'zod';
import { withApi, OPTIONS } from '@/lib/api/withApi';
import { getServerRateLimitStatus } from '@/lib/rateLimiter';

// Re-export OPTIONS for CORS preflight
export { OPTIONS };

// Zod schema for query parameters
const rateLimitStatusSchema = z.object({
  endpoint: z.string().max(100).default('general'),
});

export const GET = withApi({
  auth: 'none',
  querySchema: rateLimitStatusSchema,
}, async ({ request, query }) => {
  // Get client IP from various headers
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                  request.headers.get('x-real-ip') || 
                  request.headers.get('cf-connecting-ip') || 
                  'unknown';

  const rateLimitStatus = getServerRateLimitStatus(clientIP, query.endpoint);

  return {
    endpoint: query.endpoint,
    ...rateLimitStatus,
    timestamp: Date.now(),
  };
});
