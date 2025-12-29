import { apiClient } from "@/lib/api/client";
import { getAuthClient } from "@/firebase/client";

async function getAuthToken(): Promise<string> {
  const auth = getAuthClient();
  if (!auth?.currentUser) {
    throw new Error("Authentication required");
  }
  return auth.currentUser.getIdToken();
}

export const learningApi = {
  getLearningPoints: async (): Promise<any[]> => {
    const token = await getAuthToken();
    const response = await apiClient.get<any>("/admin/learning", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.learningPoints || [];
  },

  updateLearningPoint: async (id: string, updates: any): Promise<void> => {
    const token = await getAuthToken();
    await apiClient.put("/admin/learning", { id, ...updates }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};
