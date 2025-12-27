import { apiClient } from "@/lib/api/client";

export class ContactService {
  /**
   * Create a new contact message
   */
  async create(data: {
    name: string;
    email: string;
    message: string;
    subject?: string;
  }): Promise<any> {
    return apiClient.post(`/app/contacts`, data);
  }

  /**
   * Fetch all contacts (Admin)
   */
  async getAll(token: string, options?: { status?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    if (options?.status) params.set("status", options.status);
    if (options?.limit) params.set("limit", options.limit.toString());
    if (options?.offset) params.set("offset", options.offset.toString());

    return apiClient.get(`/app/contacts/admin${params.toString() ? `?${params.toString()}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  /**
   * Fetch a single contact message (Admin)
   */
  async getById(token: string, contactId: string) {
    return apiClient.get(`/app/contacts/admin/${contactId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  /**
   * Update the status of a contact message (Admin)
   */
  async updateStatus(token: string, contactId: string, status: string, response?: string) {
    return apiClient.put(`/app/contacts/admin/${contactId}`, { status, response }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  /**
   * Delete a contact message (Admin)
   */
  async delete(token: string, contactId: string) {
    return apiClient.delete(`/app/contacts/admin/${contactId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}

export const contactService = new ContactService();
