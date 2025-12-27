import { apiClient } from "@/lib/api/client";
import { getAuthClient } from "@/firebase/client";

export interface UserRecord {
  _id: string;
  userId: string;
  email: string;
  name: string;
  isAdmin?: boolean;
  createdAt: number;
}

export class UserService {
  /**
   * Fetch user details by ID
   */
  async getById(userId: string): Promise<UserRecord> {
    return apiClient.get<UserRecord>(`/app/users/${userId}`);
  }

  /**
   * Fetch all users (Admin)
   */
  async getAll(): Promise<UserRecord[]> {
    return apiClient.get<UserRecord[]>(`/app/users`);
  }

  /**
   * Check if a user is an admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    return apiClient.get<boolean>(`/app/admin/is-admin/${userId}`);
  }

  /**
   * Set a user as admin
   */
  async setAdmin(userId: string, requesterId: string): Promise<void> {
    return apiClient.post(`/app/admin/set-admin`, { userId, requesterId });
  }

  /**
   * Remove admin status from a user
   */
  async removeAdmin(userId: string, requesterId: string): Promise<void> {
    return apiClient.post(`/app/admin/remove-admin`, { userId, requesterId });
  }

  /**
   * Fetch user data from Firebase Auth directly (Helper)
   */
  async getFirebaseUser(uid: string) {
    const auth = getAuthClient();
    const currentUser = auth?.currentUser;
    
    if (!currentUser || currentUser.uid !== uid) {
      throw new Error("Not authenticated or UID mismatch");
    }
    
    return {
      _id: uid,
      email: currentUser.email ?? undefined,
      name: currentUser.displayName ?? undefined,
      createdAt: Date.now(),
    };
  }
}

export const userService = new UserService();
