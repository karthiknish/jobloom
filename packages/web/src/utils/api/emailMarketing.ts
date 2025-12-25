import { apiClient } from "@/lib/api/client";
import type { EmailTemplate, EmailCampaign } from "@/config/emailTemplates";

export interface EmailListResponse {
  emailList?: any[];
  segments?: Record<string, number>;
}

export const emailMarketingApi = {
  // Templates
  getTemplates: () => apiClient.get<EmailTemplate[]>("/admin/email-templates"),
  createTemplate: (template: EmailTemplate) => apiClient.post<EmailTemplate>("/api/admin/email-templates", template),
  updateTemplate: (template: EmailTemplate) => apiClient.put<EmailTemplate>("/api/admin/email-templates", template),
  deleteTemplate: (templateId: string) => apiClient.delete(`/api/admin/email-templates/${templateId}`),
  sendTemplateTest: (templateId: string) => apiClient.post("/api/admin/email-templates/test", { templateId }),

  // Campaigns
  getCampaigns: () => apiClient.get<EmailCampaign[]>("/admin/email-campaigns"),
  createCampaign: (campaign: EmailCampaign) => apiClient.post<EmailCampaign>("/api/admin/email-campaigns", campaign),
  updateCampaign: (campaign: EmailCampaign) => apiClient.put<EmailCampaign>("/api/admin/email-campaigns", campaign),
  sendCampaign: (campaignId: string) => apiClient.post<EmailCampaign>(`/api/admin/email-campaigns/${campaignId}/send`),
  deleteCampaign: (campaignId: string) => apiClient.delete(`/api/admin/email-campaigns/${campaignId}`),

  // Lists
  getEmailList: () => apiClient.get<EmailListResponse>("/admin/email-list"),

  // Utility
  sendTestEmail: (payload: { to: string; subject: string; html: string; text: string }) =>
    apiClient.post("/admin/email-test", payload),
};
