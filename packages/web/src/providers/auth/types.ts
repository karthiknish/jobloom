import type { User } from "firebase/auth";

export interface AuthState {
  user: User | null;
  loading: boolean;
  isOnline: boolean;
  isInitialized: boolean;
  lastActivity: number | null;
}
