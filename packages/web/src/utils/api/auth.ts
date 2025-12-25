import { apiClient } from "@/lib/api/client";

export const authApi = {
  requestPasswordReset: (email: string, redirectUrl?: string) =>
    apiClient.post("/auth/password/request", { email, redirectUrl }),

  resetPassword: (token: string, password: string) =>
    apiClient.post("/auth/password/reset", { token, password }),

  isAdmin: (userId: string) => apiClient.get<boolean>(`/app/admin/is-admin/${userId}`),
};
