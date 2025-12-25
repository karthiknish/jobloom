import { apiClient } from "@/lib/api/client";

export interface EmailHistoryItem {
  id: string;
  type: string;
  reminderType?: string;
  sentAt: string;
  opened?: boolean;
  clicked?: boolean;
  delivered?: boolean;
  bounced?: boolean;
  openCount?: number;
  clickCount?: number;
  lastEventAt?: string;
  automated?: boolean;
}

export interface EmailHistoryResponse {
  history: EmailHistoryItem[];
}

export const emailApi = {
  getHistory: (applicationId: string) =>
    apiClient.get<EmailHistoryResponse>(`/email/history/${applicationId}`),

  sendWelcome: (payload: { email: string; name?: string }) =>
    apiClient.post("/email/welcome", payload),
};
