import { getAdminDb } from "@/firebase/admin";
import webpush from "web-push";

interface CreateNotificationOptions {
  userId: string;
  type: 'system' | 'reminder' | 'achievement' | 'feature' | 'alert' | 'follow_up';
  title: string;
  message: string;
  actionUrl?: string;
  icon?: string;
}

export class NotificationService {
  private static isInitialized = false;

  private static init() {
    if (this.isInitialized) return;

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:support@hireall.app";

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.isInitialized = true;
    } else {
      console.warn("VAPID keys not configured. Push notifications will be disabled.");
    }
  }

  /**
   * Create an in-app notification and optionally send a push notification
   */
  static async createNotification(options: CreateNotificationOptions) {
    const db = getAdminDb();
    const { userId, type, title, message, actionUrl, icon } = options;

    // 1. Create in-app notification
    const notificationData = {
      userId,
      type,
      title,
      message,
      read: false,
      actionUrl: actionUrl || null,
      icon: icon || null,
      createdAt: Date.now(),
    };

    const docRef = await db.collection("users").doc(userId).collection("notifications").add(notificationData);

    // 2. Send push notification to all user's subscriptions
    await this.sendPushNotification(userId, {
      title,
      body: message,
      url: actionUrl,
    });

    return docRef.id;
  }

  /**
   * Send a push notification to all registered devices for a user
   */
  static async sendPushNotification(userId: string, payload: { title: string; body: string; url?: string }) {
    this.init();
    if (!this.isInitialized) return;

    const db = getAdminDb();
    const subsSnapshot = await db.collection("users").doc(userId).collection("pushSubscriptions").get();

    if (subsSnapshot.empty) return;

    const pushPayload = JSON.stringify(payload);
    const notifications = subsSnapshot.docs.map(async (doc) => {
      const subscription = doc.data() as webpush.PushSubscription;
      try {
        await webpush.sendNotification(subscription, pushPayload);
      } catch (error: any) {
        // If subscription is expired or invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Push subscription ${doc.id} for user ${userId} expired/invalid. Removing.`);
          await doc.ref.delete();
        } else {
          console.error(`Error sending push notification to ${doc.id}:`, error);
        }
      }
    });

    await Promise.all(notifications);
  }
}
