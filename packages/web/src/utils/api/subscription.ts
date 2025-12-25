import { apiClient } from "@/lib/api/client";

export const subscriptionApi = {
  getStatus: () => apiClient.get<any>("/subscription/status"),
  openPortal: () => apiClient.post<any>("/subscription/portal"),
  confirmUpgrade: (sessionId: string) => apiClient.post("/subscription/upgrade", { sessionId }),
  createCheckout: (payload: { plan: string; billingCycle: string }) =>
    apiClient.post<any>("/stripe/create-checkout-session", payload),
};
