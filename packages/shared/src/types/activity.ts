/**
 * Activity and notification types
 */

/**
 * Represents a user activity log entry for audit trail.
 */
export interface ActivityLog {
  /** Unique identifier */
  _id: string;
  /** User who performed the action */
  userId: string;
  /** Type of action performed */
  action: 'created' | 'updated' | 'deleted' | 'restored' | 'status_changed' | 'note_added' | 'cv_analyzed' | 'cover_letter_generated' | 'feedback_given' | 'suggestion_implemented';
  /** Type of entity affected */
  entityType: 'application' | 'job' | 'cv' | 'cover_letter' | 'resume' | 'ai_feedback';
  /** ID of the affected entity */
  entityId: string;
  /** Display title of the entity */
  entityTitle?: string;
  /** Additional metadata about the action */
  metadata?: Record<string, unknown>;
  /** Timestamp when the action occurred */
  createdAt: number;
}

/**
 * Represents a user notification.
 */
export interface Notification {
  /** Unique identifier */
  _id: string;
  /** User who receives the notification */
  userId: string;
  /** Type of notification */
  type: 'system' | 'reminder' | 'achievement' | 'feature' | 'alert' | 'follow_up';
  /** Notification title */
  title: string;
  /** Notification body message */
  message: string;
  /** Whether the notification has been read */
  read: boolean;
  /** Optional URL to navigate to when clicked */
  actionUrl?: string;
  /** Optional icon name */
  icon?: string;
  /** Timestamp when created */
  createdAt: number;
  /** Timestamp when read (if read) */
  readAt?: number;
}
