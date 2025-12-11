/**
 * Connection Health Utility
 * Monitors and reports the health status of the extension's connections
 */

import { checkApiHealth } from '../apiClient';
import { getFirebaseStatus, type FirebaseStatus } from '../firebase';
import { acquireIdToken } from '../authToken';
import type { CachedAuthToken } from '../authToken';
import { safeChromeStorageGet } from './safeStorage';

export interface ConnectionHealthReport {
  timestamp: number;
  api: {
    healthy: boolean;
    latency?: number;
    version?: string;
    error?: string;
  };
  firebase: {
    healthy: boolean;
    initialized: boolean;
    authInitialized: boolean;
    hasUser: boolean;
    error?: string;
  };
  auth: {
    authenticated: boolean;
    tokenValid: boolean;
    tokenSource?: string;
    tokenExpiresIn?: number;
    error?: string;
  };
  storage: {
    available: boolean;
    syncAvailable: boolean;
    localAvailable: boolean;
    error?: string;
  };
  overall: {
    healthy: boolean;
    degraded: boolean;
    issues: string[];
  };
}

const HEALTH_CHECK_CACHE_KEY = 'hireallHealthCheck';
const HEALTH_CHECK_CACHE_TTL = 30 * 1000; // 30 seconds

interface CachedHealthReport {
  report: ConnectionHealthReport;
  cachedAt: number;
}

/**
 * Check if chrome storage is available and working
 */
async function checkStorageHealth(): Promise<ConnectionHealthReport['storage']> {
  const result: ConnectionHealthReport['storage'] = {
    available: false,
    syncAvailable: false,
    localAvailable: false,
  };

  if (typeof chrome === 'undefined' || !chrome.storage) {
    result.error = 'Chrome storage API not available';
    return result;
  }

  // Check local storage
  try {
    await new Promise<void>((resolve, reject) => {
      const testKey = '__hireall_health_test__';
      const testValue = Date.now().toString();
      
      chrome.storage.local.set({ [testKey]: testValue }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        chrome.storage.local.remove(testKey, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve();
        });
      });
    });
    result.localAvailable = true;
  } catch (error) {
    result.error = `Local storage error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }

  // Check sync storage
  try {
    await new Promise<void>((resolve, reject) => {
      const testKey = '__hireall_health_test__';
      const testValue = Date.now().toString();
      
      chrome.storage.sync.set({ [testKey]: testValue }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        chrome.storage.sync.remove(testKey, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve();
        });
      });
    });
    result.syncAvailable = true;
  } catch (error) {
    if (!result.error) {
      result.error = `Sync storage error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  result.available = result.localAvailable || result.syncAvailable;
  return result;
}

/**
 * Check auth token status
 */
async function checkAuthHealth(): Promise<ConnectionHealthReport['auth']> {
  const result: ConnectionHealthReport['auth'] = {
    authenticated: false,
    tokenValid: false,
  };

  try {
    // Try to get a valid token without forcing refresh
    const token = await acquireIdToken(false);
    
    if (token) {
      result.authenticated = true;
      result.tokenValid = true;
      
      // Get cached token details
      const cached = await safeChromeStorageGet<{ hireallAuthToken: CachedAuthToken | null }>(
        'local',
        ['hireallAuthToken'],
        { hireallAuthToken: null },
        'health check auth token'
      );
      
      if (cached.hireallAuthToken) {
        result.tokenSource = cached.hireallAuthToken.source;
        result.tokenExpiresIn = cached.hireallAuthToken.expiresAt 
          ? Math.max(0, cached.hireallAuthToken.expiresAt - Date.now())
          : undefined;
      }
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown auth error';
  }

  return result;
}

/**
 * Check Firebase status
 */
function checkFirebaseHealth(): ConnectionHealthReport['firebase'] {
  const result: ConnectionHealthReport['firebase'] = {
    healthy: false,
    initialized: false,
    authInitialized: false,
    hasUser: false,
  };

  try {
    const status = getFirebaseStatus();
    
    result.initialized = status.initialized;
    result.authInitialized = status.authInitialized;
    result.hasUser = status.hasUser;
    result.healthy = status.initialized && !status.initializationError;
    
    if (status.initializationError) {
      result.error = status.initializationError;
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown Firebase error';
  }

  return result;
}

/**
 * Check API health
 */
async function checkApiHealthStatus(): Promise<ConnectionHealthReport['api']> {
  const result: ConnectionHealthReport['api'] = {
    healthy: false,
  };

  try {
    const startTime = Date.now();
    const apiStatus = await checkApiHealth();
    const latency = Date.now() - startTime;
    
    result.healthy = apiStatus.healthy;
    result.latency = latency;
    result.version = apiStatus.version;
    
    if (!apiStatus.healthy) {
      result.error = 'API reported unhealthy status';
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'API check failed';
  }

  return result;
}

/**
 * Run a full connection health check
 */
export async function checkConnectionHealth(
  options: { 
    skipCache?: boolean;
    detailed?: boolean;
  } = {}
): Promise<ConnectionHealthReport> {
  const { skipCache = false, detailed = true } = options;

  // Check cache first
  if (!skipCache) {
    try {
      const cached = await safeChromeStorageGet<{ [HEALTH_CHECK_CACHE_KEY]: CachedHealthReport | null }>(
        'local',
        [HEALTH_CHECK_CACHE_KEY],
        { [HEALTH_CHECK_CACHE_KEY]: null },
        'health check cache'
      );
      
      if (cached[HEALTH_CHECK_CACHE_KEY]) {
        const { report, cachedAt } = cached[HEALTH_CHECK_CACHE_KEY];
        if (Date.now() - cachedAt < HEALTH_CHECK_CACHE_TTL) {
          return report;
        }
      }
    } catch (error) {
      // Ignore cache errors, proceed with fresh check
    }
  }

  // Run health checks in parallel
  const [storage, auth, api] = await Promise.all([
    checkStorageHealth(),
    checkAuthHealth(),
    detailed ? checkApiHealthStatus() : Promise.resolve({ healthy: true } as ConnectionHealthReport['api']),
  ]);

  // Firebase check is synchronous
  const firebase = checkFirebaseHealth();

  // Compile issues list
  const issues: string[] = [];
  
  if (!storage.available) {
    issues.push('Storage not available');
  }
  
  if (!firebase.initialized) {
    issues.push('Firebase not initialized');
  } else if (!firebase.authInitialized) {
    issues.push('Firebase Auth not initialized');
  }
  
  if (!auth.authenticated) {
    issues.push('Not authenticated');
  } else if (!auth.tokenValid) {
    issues.push('Auth token invalid');
  } else if (auth.tokenExpiresIn && auth.tokenExpiresIn < 5 * 60 * 1000) {
    issues.push('Auth token expiring soon');
  }
  
  if (!api.healthy) {
    issues.push('API connection unhealthy');
  } else if (api.latency && api.latency > 5000) {
    issues.push('API latency high');
  }

  // Determine overall health
  const criticalIssues = issues.filter(i => 
    i.includes('not available') || 
    i.includes('not initialized') || 
    i.includes('unhealthy')
  );
  
  const healthy = criticalIssues.length === 0 && issues.length === 0;
  const degraded = criticalIssues.length === 0 && issues.length > 0;

  const report: ConnectionHealthReport = {
    timestamp: Date.now(),
    api,
    firebase,
    auth,
    storage,
    overall: {
      healthy,
      degraded,
      issues,
    },
  };

  // Cache the report
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({
        [HEALTH_CHECK_CACHE_KEY]: {
          report,
          cachedAt: Date.now(),
        },
      });
    }
  } catch (error) {
    // Ignore cache write errors
  }

  return report;
}

/**
 * Get a quick health summary without detailed API checks
 */
export async function getQuickHealthSummary(): Promise<{
  healthy: boolean;
  message: string;
  issues: string[];
}> {
  const report = await checkConnectionHealth({ detailed: false });
  
  let message = 'All systems operational';
  
  if (!report.overall.healthy) {
    if (report.overall.issues.length === 1) {
      message = report.overall.issues[0];
    } else {
      message = `${report.overall.issues.length} issues detected`;
    }
  } else if (report.overall.degraded) {
    message = 'Some features may be limited';
  }
  
  return {
    healthy: report.overall.healthy,
    message,
    issues: report.overall.issues,
  };
}

/**
 * Watch for connection health changes
 */
export function watchConnectionHealth(
  callback: (report: ConnectionHealthReport) => void,
  intervalMs: number = 60000
): () => void {
  let isActive = true;
  
  const check = async () => {
    if (!isActive) return;
    
    try {
      const report = await checkConnectionHealth({ skipCache: true });
      callback(report);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };
  
  // Initial check
  check();
  
  // Set up interval
  const intervalId = setInterval(check, intervalMs);
  
  // Return cleanup function
  return () => {
    isActive = false;
    clearInterval(intervalId);
  };
}

/**
 * Log connection health report to console for debugging
 */
export function logHealthReport(report: ConnectionHealthReport): void {
  const status = report.overall.healthy ? 'OK' : report.overall.degraded ? 'WARN' : 'FAIL';
  
  console.group(`${status} HireAll Connection Health Report`);
  console.log(`Timestamp: ${new Date(report.timestamp).toISOString()}`);
  
  console.group('API');
  console.log(`Healthy: ${report.api.healthy ? 'OK' : 'FAIL'}`);
  if (report.api.latency) console.log(`Latency: ${report.api.latency}ms`);
  if (report.api.version) console.log(`Version: ${report.api.version}`);
  if (report.api.error) console.log(`Error: ${report.api.error}`);
  console.groupEnd();
  
  console.group('Firebase');
  console.log(`Healthy: ${report.firebase.healthy ? 'OK' : 'FAIL'}`);
  console.log(`Initialized: ${report.firebase.initialized}`);
  console.log(`Auth Initialized: ${report.firebase.authInitialized}`);
  console.log(`Has User: ${report.firebase.hasUser}`);
  if (report.firebase.error) console.log(`Error: ${report.firebase.error}`);
  console.groupEnd();
  
  console.group('Auth');
  console.log(`Authenticated: ${report.auth.authenticated ? 'OK' : 'FAIL'}`);
  console.log(`Token Valid: ${report.auth.tokenValid}`);
  if (report.auth.tokenSource) console.log(`Token Source: ${report.auth.tokenSource}`);
  if (report.auth.tokenExpiresIn) console.log(`Token Expires In: ${Math.round(report.auth.tokenExpiresIn / 1000)}s`);
  if (report.auth.error) console.log(`Error: ${report.auth.error}`);
  console.groupEnd();
  
  console.group('Storage');
  console.log(`Available: ${report.storage.available ? 'OK' : 'FAIL'}`);
  console.log(`Local: ${report.storage.localAvailable}`);
  console.log(`Sync: ${report.storage.syncAvailable}`);
  if (report.storage.error) console.log(`Error: ${report.storage.error}`);
  console.groupEnd();
  
  console.group('Overall');
  console.log(`Healthy: ${report.overall.healthy}`);
  console.log(`Degraded: ${report.overall.degraded}`);
  if (report.overall.issues.length > 0) {
    console.log('Issues:', report.overall.issues);
  }
  console.groupEnd();
  
  console.groupEnd();
}
