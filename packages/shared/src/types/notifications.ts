/**
 * Notification and Toast related types
 */

export type NotificationType = "success" | "info" | "warning" | "error" | "loading";

export interface NotificationAction {
  label: string;
  onClick: () => void | Promise<void>;
}

export interface NotificationOptions {
  type?: NotificationType;
  description?: string;
  duration?: number;
  action?: NotificationAction;
  id?: string | number;
}
