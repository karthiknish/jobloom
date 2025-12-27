/**
 * Application-related types
 */

import type { Job } from './job';

/**
 * Valid statuses for the Kanban board.
 */
export type KanbanStatus =
  | "interested"
  | "applied"
  | "offered"
  | "rejected"
  | "withdrawn";

/**
 * Available views in the main dashboard.
 */
export type DashboardView =
  | "dashboard"
  | "jobs"
  | "applications"
  | "analytics";

/**
 * Display modes for the board.
 */
export type BoardMode = "list" | "kanban";

/**
 * Represents a user's application to a job.
 */
export interface Application {
  /** Unique identifier for the application */
  _id: string;
  /** ID of the associated job */
  jobId: string;
  /** User who owns this application */
  userId: string;
  /** Current status of the application */
  status: KanbanStatus;
  /** Date the user applied (timestamp) */
  appliedDate?: number;
  /** User notes about the application */
  notes?: string;
  /** Scheduled follow-up date (timestamp) */
  followUpDate?: number;
  /** Order in the Kanban column */
  order?: number;
  /** Full job data if populated */
  job?: Job;
  /** Timestamp when created */
  createdAt: number;
  /** Timestamp when last updated */
  updatedAt: number;
  /** Whether the application is soft-deleted */
  isDeleted?: boolean;
  /** Timestamp when deleted (for soft-delete) */
  deletedAt?: number | null;
}

/**
 * A saved view/filter for the dashboard.
 */
export interface SavedView {
  /** Unique ID of the view */
  id: string;
  /** Human-readable name */
  name: string;
  /** Filter configuration */
  filters: Record<string, unknown>;
}

export interface CreateApplicationRequest {
  jobId: string;
  status?: KanbanStatus;
  notes?: string;
}

export interface CreateApplicationResponse {
  id: string;
}

export interface UpdateApplicationRequest {
  status?: KanbanStatus;
  notes?: string;
  appliedDate?: number;
  followUpDate?: number;
  order?: number;
}
