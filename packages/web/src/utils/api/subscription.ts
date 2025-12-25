import { apiClient } from "@/lib/api/client";

export const subscriptionApi = {
  // Subscription endpoints are rate-limited; do not auto-retry on 429.
  getStatus: () => apiClient.get<any>("/subscription/status", { retries: 0 }),
  openPortal: () => apiClient.post<any>("/subscription/portal", undefined, { retries: 0 }),
  confirmUpgrade: (sessionId: string) => apiClient.post("/subscription/upgrade", { sessionId }, { retries: 0 }),
  createCheckout: (payload: { plan: string; billingCycle: string }) =>
    apiClient.post<any>("/stripe/create-checkout-session", payload, { retries: 0 }),
};
