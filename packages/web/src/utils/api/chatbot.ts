import { apiClient } from "@/lib/api/client";

export const chatbotApi = {
  sendMessage: (payload: { message: string; context?: string }) =>
    apiClient.post<{ response: string }>("/api/chatbot", payload),
};
