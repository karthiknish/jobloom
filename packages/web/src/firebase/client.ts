import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  GoogleAuthProvider,
  connectAuthEmulator,
} from "firebase/auth";
import {
  getFirestore,
  type Firestore,
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork,
  waitForPendingWrites,
} from "firebase/firestore";
import {
  getStorage,
  type FirebaseStorage,
  connectStorageEmulator,
} from "firebase/storage";
import {
  getAnalytics,
  type Analytics,
  isSupported as analyticsSupported,
} from "firebase/analytics";
import { getPerformance, type FirebasePerformance } from "firebase/performance";
import {
  getRemoteConfig,
  type RemoteConfig,
  isSupported as remoteConfigSupported,
} from "firebase/remote-config";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface FirebaseServices {
  app: FirebaseApp | undefined;
  auth: Auth | undefined;
  db: Firestore | undefined;
  storage: FirebaseStorage | undefined;
  analytics: Analytics | undefined;
  performance: FirebasePerformance | undefined;
  remoteConfig: RemoteConfig | undefined;
}

export interface FirebaseConnectionState {
  isOnline: boolean;
  isConnected: boolean;
  lastConnectionTime: number | null;
  retryCount: number;
}

// Validate Firebase config
function validateFirebaseConfig(): FirebaseConfig {
  const authDomain =
    process.env.NEXT_PUBLIC_FIREBASE_CUSTOM_AUTH_DOMAIN ||
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Check for missing config values
  const missingKeys = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase configuration: ${missingKeys.join(", ")}`
    );
  }

  return config as FirebaseConfig;
}

// Connection state management
const initialConnectionState: FirebaseConnectionState = {
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  isConnected: false,
  lastConnectionTime: null,
  retryCount: 0,
};

// eslint-disable-next-line prefer-const
let connectionState = { ...initialConnectionState };

const connectionListeners = new Set<(state: FirebaseConnectionState) => void>();

// Firebase configuration
const firebaseConfig = validateFirebaseConfig();
const isDevelopment = process.env.NODE_ENV === "development";
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

let services: FirebaseServices | undefined;

// Initialize Firebase App with error handling
export function ensureFirebaseApp(): FirebaseApp | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    if (!services) {
      const existing = getApps();
      const app = existing.length
        ? existing[0]!
        : initializeApp(firebaseConfig);

      // Initialize all services
      services = {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
        storage: getStorage(app),
        analytics: undefined, // Will be initialized asynchronously
        performance: undefined, // Will be initialized asynchronously
        remoteConfig: undefined, // Will be initialized asynchronously
      };

      // Setup connection monitoring
      setupConnectionMonitoring();

      // Initialize async services
      initializeAnalytics();
      initializePerformance();
      initializeRemoteConfig();

      // Setup emulators in development
      if (useEmulators && isDevelopment) {
        setupEmulators();
      }

      connectionState.isConnected = true;
      connectionState.lastConnectionTime = Date.now();
      notifyConnectionListeners();
    }

    return services.app;
  } catch (error) {
    console.error("Failed to initialize Firebase app:", error);
    connectionState.isConnected = false;
    notifyConnectionListeners();
    return undefined;
  }
}

// Initialize Analytics asynchronously
async function initializeAnalytics(): Promise<void> {
  try {
    if (services && (await analyticsSupported())) {
      services.analytics = getAnalytics(services.app!);
      if (process.env.NODE_ENV === 'development') {
        console.log('[FirebaseClient] Analytics initialized successfully');
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[FirebaseClient] Analytics not supported or services not available');
      }
    }
  } catch (error) {
    console.warn("[FirebaseClient] Analytics initialization failed:", error);
    services!.analytics = undefined; // Ensure it's undefined on failure
  }
}

// Initialize Performance Monitoring asynchronously
async function initializePerformance(): Promise<void> {
  try {
    if (services) {
      services.performance = getPerformance(services.app!);
    }
  } catch (error) {
    console.warn(
      "Firebase Performance Monitoring initialization failed:",
      error
    );
  }
}

// Initialize Remote Config asynchronously
async function initializeRemoteConfig(): Promise<void> {
  try {
    if (services && (await remoteConfigSupported())) {
      services.remoteConfig = getRemoteConfig(services.app!);
      // Configure Remote Config settings
      services.remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
      services.remoteConfig.defaultConfig = {
        feature_job_import: true,
        feature_cv_analysis: true,
        feature_advanced_filters: true,
        max_jobs_per_import: 50,
        session_timeout_hours: 24,
      };
    }
  } catch (error) {
    console.warn("Firebase Remote Config initialization failed:", error);
  }
}

// Setup Firebase emulators for development
function setupEmulators(): void {
  if (!services) return;

  try {
    // Connect to emulators
    connectAuthEmulator(services.auth!, "http://localhost:9099", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(services.db!, "localhost", 8080);
    connectStorageEmulator(services.storage!, "localhost", 9199);

    console.log("Connected to Firebase emulators");
  } catch (error) {
    console.warn("Failed to connect to emulators:", error);
  }
}

// Connection monitoring
function setupConnectionMonitoring(): void {
  if (typeof window === "undefined") return;

  // Monitor online/offline status
  window.addEventListener("online", () => {
    connectionState.isOnline = true;
    handleReconnection();
  });

  window.addEventListener("offline", () => {
    connectionState.isOnline = false;
    handleDisconnection();
  });

  // Monitor Firebase connection
  if (services?.db) {
    // Firestore connection monitoring could be added here
  }
}

function handleReconnection(): void {
  if (!services?.db) return;

  try {
    enableNetwork(services.db);
    connectionState.isConnected = true;
    connectionState.lastConnectionTime = Date.now();
    connectionState.retryCount = 0;
    notifyConnectionListeners();
  } catch (error) {
    console.warn("Failed to enable Firebase network:", error);
  }
}

function handleDisconnection(): void {
  if (!services?.db) return;

  try {
    disableNetwork(services.db);
    connectionState.isConnected = false;
    notifyConnectionListeners();
  } catch (error) {
    console.warn("Failed to disable Firebase network:", error);
  }
}

// Connection state management
export function addConnectionListener(
  callback: (state: FirebaseConnectionState) => void
): () => void {
  connectionListeners.add(callback);
  return () => connectionListeners.delete(callback);
}

function notifyConnectionListeners(): void {
  connectionListeners.forEach((callback) => callback({ ...connectionState }));
}

export function getConnectionState(): FirebaseConnectionState {
  return { ...connectionState };
}

// Service getters with error handling
export function getAuthClient(): Auth | undefined {
  try {
    return services?.auth;
  } catch (error) {
    console.error("Error getting Firebase Auth:", error);
    return undefined;
  }
}

export function getGoogleProvider(): GoogleAuthProvider | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    return provider;
  } catch (error) {
    console.error("Error creating Google provider:", error);
    return undefined;
  }
}

export function getDb(): Firestore | undefined {
  try {
    return services?.db;
  } catch (error) {
    console.error("Error getting Firestore:", error);
    return undefined;
  }
}

export function getStorageClient(): FirebaseStorage | undefined {
  try {
    return services?.storage;
  } catch (error) {
    console.error("Error getting Firebase Storage:", error);
    return undefined;
  }
}

export function getAnalyticsClient(): Analytics | undefined {
  return services?.analytics;
}

export function getPerformanceClient(): FirebasePerformance | undefined {
  return services?.performance;
}

export function getRemoteConfigClient(): RemoteConfig | undefined {
  return services?.remoteConfig;
}

// Utility functions
export async function waitForFirebasePendingWrites(): Promise<void> {
  if (!services?.db) return;
  try {
    await waitForPendingWrites(services.db);
  } catch (error) {
    console.warn("Error waiting for pending writes:", error);
  }
}

export function isFirebaseInitialized(): boolean {
  return !!services?.app;
}

export function isUsingEmulators(): boolean {
  return useEmulators && isDevelopment;
}
