/**
 * Contact submission types
 */

export interface ContactSubmission {
  _id: string;
  name: string;
  email: string;
  message: string;
  subject?: string;
  status: "new" | "read" | "responded" | "archived";
  createdAt: number;
  updatedAt: number;
  response?: string;
  respondedAt?: number;
  respondedBy?: string;
}
