import { getDb, getAuthClient } from "@/firebase/client";
import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit, 
  getDocs,
  DocumentData 
} from "firebase/firestore";
import { ActivityLog } from "@hireall/shared";

export class ActivityLogService {
  private collectionName = "activity_logs";

  /**
   * Log a user activity
   */
  async log(
    action: ActivityLog["action"],
    entityType: ActivityLog["entityType"],
    entityId: string,
    options?: {
      entityTitle?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<string> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");
    
    const auth = getAuthClient();
    const uid = auth?.currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");

    const logEntry: Omit<ActivityLog, "_id"> = {
      userId: uid,
      action,
      entityType,
      entityId,
      entityTitle: options?.entityTitle,
      metadata: options?.metadata,
      createdAt: Date.now(),
    };

    const docRef = await addDoc(collection(db, this.collectionName), logEntry as DocumentData);
    return docRef.id;
  }

  /**
   * Get activity logs for a user with pagination
   */
  async getByUser(
    userId: string,
    options?: {
      limit?: number;
      entityType?: ActivityLog["entityType"];
    }
  ): Promise<ActivityLog[]> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const constraints: any[] = [
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    ];

    if (options?.entityType) {
      constraints.push(where("entityType", "==", options.entityType));
    }

    if (options?.limit) {
      constraints.push(firestoreLimit(options.limit));
    } else {
      constraints.push(firestoreLimit(50)); // Default limit
    }

    const q = query(collection(db, this.collectionName), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    })) as ActivityLog[];
  }

  /**
   * Get activity logs for a specific entity
   */
  async getByEntity(entityId: string): Promise<ActivityLog[]> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const q = query(
      collection(db, this.collectionName),
      where("entityId", "==", entityId),
      orderBy("createdAt", "desc"),
      firestoreLimit(20)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    })) as ActivityLog[];
  }
}

export const activityLogService = new ActivityLogService();
