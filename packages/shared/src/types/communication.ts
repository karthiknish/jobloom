/**
 * Web-Extension Communication Types
 */

export type ExtensionMessageType = 
  | "AUTH_STATE_CHANGE"
  | "PING"
  | "PONG"
  | "SAVE_JOB"
  | "SYNC_JOBS"
  | "GET_SETTINGS"
  | "UPDATE_SETTINGS"
  | "NOTIFICATION"
  | "LOG_ERROR";

export interface ExtensionMessage<T = any> {
  type: ExtensionMessageType;
  data?: T;
  timestamp: number;
  source: "web" | "extension" | "content-script" | "background";
  id?: string;
}

export interface SaveJobRequest {
  jobData: any; // Using any for now, matches JobData subset
  autoSave?: boolean;
}

export interface AuthStateMessage {
  isAuthenticated: boolean;
  userId?: string;
  token?: string;
}
