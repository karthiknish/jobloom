import { getDb, getAuthClient } from "@/firebase/client";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit, 
  getDocs,
  writeBatch,
  DocumentData 
} from "firebase/firestore";
import { Notification } from "@hireall/shared";

export class NotificationsService {
  private collectionName = "notifications";

  /**
   * Create a new notification
   */
  async create(notification: Omit<Notification, "_id" | "createdAt" | "read">): Promise<string> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const payload = {
      ...notification,
      read: false,
      createdAt: Date.now(),
    };

    const docRef = await addDoc(collection(db, this.collectionName), payload as DocumentData);
    return docRef.id;
  }

  /**
   * Get unread notifications for a user
   */
  async getUnread(userId: string): Promise<Notification[]> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const q = query(
      collection(db, this.collectionName),
      where("userId", "==", userId),
      where("read", "==", false),
      orderBy("createdAt", "desc"),
      firestoreLimit(20)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    })) as Notification[];
  }

  /**
   * Get all notifications for a user with pagination
   */
  async getAll(userId: string, limit = 50): Promise<Notification[]> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const q = query(
      collection(db, this.collectionName),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    })) as Notification[];
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const q = query(
      collection(db, this.collectionName),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const ref = doc(db, this.collectionName, notificationId);
    await updateDoc(ref, {
      read: true,
      readAt: Date.now(),
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const db = getDb();
    if (!db) throw new Error("Firestore not initialized");

    const q = query(
      collection(db, this.collectionName),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    const now = Date.now();

    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, { read: true, readAt: now });
    });

    await batch.commit();
  }
}

export const notificationsService = new NotificationsService();
