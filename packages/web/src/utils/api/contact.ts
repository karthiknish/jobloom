// utils/api/contact.ts
import { appApi } from "../../services/api/appApi";

export const contactApi = {
  createContact: async (data: {
    name: string;
    email: string;
    message: string;
  }): Promise<void> => {
    await appApi.createContact(data);
  },
};