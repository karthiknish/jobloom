import { apiClient } from "@/lib/api/client";

export interface PreferencesPayload {
  preferences: Record<string, unknown>;
}

export const settingsApi = {
  getPreferences: () => apiClient.get<any>("/settings/preferences"),
  updatePreferences: (payload: PreferencesPayload) => apiClient.put("/settings/preferences", payload),
  exportData: () => apiClient.get<any>("/settings/export"),
  deleteAccount: (payload: { confirmation: string; reason?: string }) =>
    apiClient.post<any>("/settings/delete-account", payload),
};
