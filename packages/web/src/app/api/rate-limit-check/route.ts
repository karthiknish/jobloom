/**
 * Rate Limit Check API Endpoint
 *
 * This endpoint allows the extension to check rate limits against
 * the server-side Upstash Redis rate limiter.
 */

import { z } from "zod";
import { withApi, OPTIONS } from "@/lib/api/withApi";
import {
  checkServerRateLimitWithAuth,
  getRateLimitConfig,
  isRateLimitingDistributed,
} from "@/lib/rateLimiter";

export { OPTIONS };

const rateLimitCheckSchema = z.object({
  endpoint: z.string().min(1).max(100),
});

export const POST = withApi(
  {
    auth: "optional",
    bodySchema: rateLimitCheckSchema,
    rateLimit: "general",
    skipCsrf: true, // Extension requests won't have CSRF tokens
  },
  async ({ body, user, request }) => {
    const { endpoint } = body;

    // Get client identifier (user ID or IP)
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const identifier = user?.uid || forwarded?.split(",")[0].trim() || realIp || "unknown";

    // Get auth token for tier detection
    const authHeader = request.headers.get("authorization");
    const authToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;

    // Check rate limit using Upstash (or fallback to in-memory)
    const result = await checkServerRateLimitWithAuth(
      identifier,
      endpoint,
      authToken
    );

    // Get the config for reference
    const config = getRateLimitConfig(endpoint, user?.tier || "free");

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetIn: result.resetIn,
      maxRequests: result.maxRequests || config.maxRequests,
      retryAfter: result.retryAfter,
      violations: result.violations,
      abuseDetected: result.abuseDetected,
      distributed: isRateLimitingDistributed(),
    };
  }
);
