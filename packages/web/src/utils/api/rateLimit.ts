import { apiClient } from "@/lib/api/client";
import type { RateLimitStatus } from "@/hooks/useRateLimitStatus";

export const rateLimitApi = {
  getStatus: () => apiClient.get<RateLimitStatus & { retryAfter?: number }>("/api/rate-limit-status"),
  check: (endpoint: string) => apiClient.post("/api/rate-limit-check", { endpoint }),
};
