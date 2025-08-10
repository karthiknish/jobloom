// utils/api/contact.ts
import { convexApi } from "../../services/api/convexApi";

export const contactApi = {
  createContact: async (data: { name: string; email: string; message: string; }): Promise<void> => {
    await convexApi.createContact(data);
  }
};