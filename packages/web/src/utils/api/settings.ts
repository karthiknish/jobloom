import { apiClient } from "@/lib/api/client";

export interface PreferencesPayload {
  preferences: Record<string, unknown>;
}

const PREFERENCES_CACHE_TTL_MS = 30_000;
let cachedPreferencesResponse: any | null = null;
let cachedPreferencesAtMs = 0;
let inFlightPreferencesRequest: Promise<any> | null = null;

export const settingsApi = {
  getPreferences: async () => {
    const now = Date.now();
    if (
      cachedPreferencesResponse &&
      now - cachedPreferencesAtMs < PREFERENCES_CACHE_TTL_MS
    ) {
      return cachedPreferencesResponse;
    }

    if (inFlightPreferencesRequest) return inFlightPreferencesRequest;

    inFlightPreferencesRequest = apiClient
      .get<any>("/settings/preferences")
      .then((data) => {
        cachedPreferencesResponse = data;
        cachedPreferencesAtMs = Date.now();
        return data;
      })
      .finally(() => {
        inFlightPreferencesRequest = null;
      });

    return inFlightPreferencesRequest;
  },
  updatePreferences: async (payload: PreferencesPayload) => {
    const result = await apiClient.put<any>("/settings/preferences", payload);
    // Optimistically update cache so subsequent reads don't refetch.
    if (cachedPreferencesResponse?.preferences && payload?.preferences) {
      cachedPreferencesResponse = {
        ...cachedPreferencesResponse,
        preferences: {
          ...cachedPreferencesResponse.preferences,
          ...payload.preferences,
        },
      };
      cachedPreferencesAtMs = Date.now();
    } else {
      cachedPreferencesResponse = null;
      cachedPreferencesAtMs = 0;
    }
    return result;
  },
  exportData: () => apiClient.get<any>("/settings/export"),
  deleteAccount: (payload: { confirmation: string; reason?: string }) =>
    apiClient.post<any>("/settings/delete-account", payload),
  updateRootProfile: (payload: { name?: string; photoURL?: string }) =>
    apiClient.patch<any>("/app/profile", payload),
};
