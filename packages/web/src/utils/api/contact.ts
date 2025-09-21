// utils/api/contact.ts
import { appApi } from "../../services/api/appApi";
import type { ContactSubmission } from "../../types/api";

export const contactApi = {
  createContact: async (data: {
    name: string;
    email: string;
    message: string;
    subject?: string;
  }): Promise<{ success: boolean; message: string; contactId: string }> => {
    return appApi.createContact(data) as Promise<{
      success: boolean;
      message: string;
      contactId: string;
    }>;
  },

  // Admin functions
  getAllContacts: async (
    token: string,
    options?: { status?: string; limit?: number; offset?: number }
  ) => {
    return appApi.getAllContacts(token, options);
  },

  getContact: async (token: string, contactId: string) => {
    return appApi.getContact(token, contactId);
  },

  updateContact: async (
    token: string,
    contactId: string,
    updates: { status?: string; response?: string }
  ) => {
    return appApi.updateContactStatus(
      token,
      contactId,
      updates.status || "",
      updates.response
    );
  },

  deleteContact: async (token: string, contactId: string) => {
    return appApi.deleteContact(token, contactId);
  },
};