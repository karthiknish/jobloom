import { apiClient } from "@/lib/api/client";
import { Application, KanbanStatus } from "@/types/dashboard";
import { getDb, getAuthClient } from "@/firebase/client";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  DocumentData,
  UpdateData
} from "firebase/firestore";

export interface PaginatedApplications {
  applications: Application[];
  count: number;
  nextCursor: string | number | null;
  message?: string;
}

export class ApplicationsService {
  /**
   * Fetch applications for a user with pagination support
   */
  async getByUser(userId: string, options?: { limit?: number; cursor?: string | number }): Promise<PaginatedApplications> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.cursor) params.append('cursor', options.cursor.toString());

    const queryString = params.toString();
    const endpoint = `/app/applications/user/${userId}${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<PaginatedApplications>(endpoint);
  }

  /**
   * Create a new application in Firestore
   */
  async create(data: Partial<Application>): Promise<{ applicationId: string }> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const auth = getAuthClient();
    const uid = auth?.currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");

    const payload = {
      ...data,
      userId: uid,
      status: data.status || "interested",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const res = await addDoc(collection(db, "applications"), payload as DocumentData);
    return { applicationId: res.id };
  }

  /**
   * Update an existing application in Firestore
   */
  async update(applicationId: string, data: Partial<Application>): Promise<void> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const ref = doc(db, "applications", applicationId);
    const updateData: UpdateData<DocumentData> = {
      ...data,
      updatedAt: Date.now(),
    };

    // Remove complex nested objects if they exist in Partial<Application> but shouldn't be in update
    delete (updateData as any).job;

    await updateDoc(ref, updateData);
  }

  /**
   * Soft-delete an application (marks as deleted, can be restored)
   */
  async softDelete(applicationId: string): Promise<void> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const ref = doc(db, "applications", applicationId);
    await updateDoc(ref, {
      isDeleted: true,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  /**
   * Restore a soft-deleted application
   */
  async restore(applicationId: string): Promise<void> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const ref = doc(db, "applications", applicationId);
    await updateDoc(ref, {
      isDeleted: false,
      deletedAt: null,
      updatedAt: Date.now(),
    });
  }

  /**
   * Permanently delete an application from Firestore (hard delete)
   */
  async hardDelete(applicationId: string): Promise<void> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, "applications", applicationId));
  }

  /**
   * Soft-delete for backwards compatibility (use softDelete instead)
   */
  async delete(applicationId: string): Promise<void> {
    return this.softDelete(applicationId);
  }

  /**
   * Update the status of an application
   */
  async updateStatus(applicationId: string, status: KanbanStatus | string): Promise<void> {
    return this.update(applicationId, { status } as any);
  }

  /**
   * Update the display order of an application (Kanban)
   */
  async updateOrder(applicationId: string, order: number): Promise<void> {
    return this.update(applicationId, { order } as any);
  }

  /**
   * Bulk update status for multiple applications
   */
  async bulkUpdateStatus(applicationIds: string[], status: KanbanStatus | string): Promise<void> {
    if (!applicationIds.length) return;
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const batch = writeBatch(db);
    const now = Date.now();

    applicationIds.forEach((id) => {
      batch.update(doc(db, "applications", id), { status, updatedAt: now });
    });

    await batch.commit();
  }

  /**
   * Bulk soft-delete multiple applications
   */
  async bulkSoftDelete(applicationIds: string[]): Promise<void> {
    if (!applicationIds.length) return;
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const batch = writeBatch(db);
    const now = Date.now();

    applicationIds.forEach((id) => {
      batch.update(doc(db, "applications", id), {
        isDeleted: true,
        deletedAt: now,
        updatedAt: now
      });
    });

    await batch.commit();
  }

  /**
   * Bulk restore multiple soft-deleted applications
   */
  async bulkRestore(applicationIds: string[]): Promise<void> {
    if (!applicationIds.length) return;
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const batch = writeBatch(db);
    const now = Date.now();

    applicationIds.forEach((id) => {
      batch.update(doc(db, "applications", id), {
        isDeleted: false,
        deletedAt: null,
        updatedAt: now
      });
    });

    await batch.commit();
  }

  /**
   * Bulk update follow-up date for multiple applications
   */
  async bulkUpdateFollowUp(applicationIds: string[], followUpDate?: number): Promise<void> {
    if (!applicationIds.length) return;
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const batch = writeBatch(db);
    const now = Date.now();

    applicationIds.forEach((id) => {
      batch.update(doc(db, "applications", id), {
        followUpDate: followUpDate || null,
        updatedAt: now
      });
    });

    await batch.commit();
  }
}

export const applicationsService = new ApplicationsService();
