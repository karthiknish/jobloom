import { acquireIdToken, clearCachedAuthToken } from '../authToken';
import { UserProfileManager } from '../components/UserProfileManager';
import { logger } from './logger';

export interface AuthDiagnostics {
  timestamp: string;
  hasStoredAuth: boolean;
  canAcquireToken: boolean;
  tokenSource?: string;
  tokenExpiry?: number;
  userId?: string | null;
  userEmail?: string | null;
  chromeStorageAvailable: boolean;
  extensionContextValid: boolean;
  errors: string[];
}

export class AuthDiagnostics {
  static async runDiagnostics(): Promise<AuthDiagnostics> {
    const diagnostics: AuthDiagnostics = {
      timestamp: new Date().toISOString(),
      hasStoredAuth: false,
      canAcquireToken: false,
      chromeStorageAvailable: false,
      extensionContextValid: false,
      errors: [],
    };

    try {
      // Check if chrome storage is available
      diagnostics.chromeStorageAvailable = typeof chrome !== 'undefined' && !!chrome.storage;
      if (!diagnostics.chromeStorageAvailable) {
        diagnostics.errors.push('Chrome storage API not available');
      }

      // Check if extension context is valid
      diagnostics.extensionContextValid = typeof chrome !== 'undefined' && !!chrome.runtime?.id;
      if (!diagnostics.extensionContextValid) {
        diagnostics.errors.push('Extension context invalid (runtime.id missing)');
      }

      // Check stored authentication state
      try {
        diagnostics.hasStoredAuth = await UserProfileManager.isUserAuthenticated();
        diagnostics.userId = await UserProfileManager.getUserId();
        
        const preferences = await UserProfileManager.getUserPreferences();
        diagnostics.userEmail = preferences.webAppUrl; // This is a hack, we need to get actual email
        
        logger.debug('AuthDiagnostics', 'Stored auth check completed', {
          hasStoredAuth: diagnostics.hasStoredAuth,
          userId: diagnostics.userId
        });
      } catch (error) {
        diagnostics.errors.push(`Failed to check stored auth: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Check token acquisition
      try {
        const token = await acquireIdToken();
        if (token) {
          diagnostics.canAcquireToken = true;
          logger.debug('AuthDiagnostics', 'Token acquisition successful');
        } else {
          // Try with force refresh
          const forceRefreshToken = await acquireIdToken(true);
          if (forceRefreshToken) {
            diagnostics.canAcquireToken = true;
            logger.debug('AuthDiagnostics', 'Token acquisition successful with force refresh');
          } else {
            diagnostics.errors.push('Unable to acquire token even with force refresh');
          }
        }
      } catch (error) {
        diagnostics.errors.push(`Token acquisition failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Check cached token details
      try {
        if (diagnostics.chromeStorageAvailable) {
          const result = await new Promise<any>((resolve) => {
            chrome.storage.local.get(['hireallAuthToken'], resolve);
          });
          
          if (result.hireallAuthToken) {
            diagnostics.tokenSource = result.hireallAuthToken.source;
            diagnostics.tokenExpiry = result.hireallAuthToken.expiresAt;
            logger.debug('AuthDiagnostics', 'Cached token found', {
              source: diagnostics.tokenSource,
              expiresAt: diagnostics.tokenExpiry
            });
          }
        }
      } catch (error) {
        diagnostics.errors.push(`Failed to check cached token: ${error instanceof Error ? error.message : String(error)}`);
      }

    } catch (error) {
      diagnostics.errors.push(`Diagnostic run failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    logger.info('AuthDiagnostics', 'Authentication diagnostics completed', diagnostics);
    return diagnostics;
  }

  static async attemptAuthRepair(): Promise<boolean> {
    logger.info('AuthDiagnostics', 'Attempting authentication repair');

    try {
      // Clear cached tokens
      await clearCachedAuthToken();
      logger.debug('AuthDiagnostics', 'Cleared cached tokens');

      // Try to sync auth state from site
      const { ExtensionMessageHandler } = await import('../components/ExtensionMessageHandler');
      const syncResult = await ExtensionMessageHandler.sendMessage("syncAuthState", {}, 3);
      
      if (syncResult?.userId) {
        logger.info('AuthDiagnostics', 'Auth state sync successful during repair', {
          userId: syncResult.userId
        });

        // Test token acquisition after sync
        const testToken = await acquireIdToken(true);
        if (testToken) {
          logger.info('AuthDiagnostics', 'Authentication repair successful');
          return true;
        }
      }

      logger.warn('AuthDiagnostics', 'Authentication repair failed - sync did not restore functionality');
      return false;
    } catch (error) {
      logger.error('AuthDiagnostics', 'Authentication repair failed with error', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  static formatDiagnostics(diagnostics: AuthDiagnostics): string {
    const lines = [
      '=== Authentication Diagnostics ===',
      `Timestamp: ${diagnostics.timestamp}`,
      `Chrome Storage Available: ${diagnostics.chromeStorageAvailable ? '✅' : '❌'}`,
      `Extension Context Valid: ${diagnostics.extensionContextValid ? '✅' : '❌'}`,
      `Has Stored Auth: ${diagnostics.hasStoredAuth ? '✅' : '❌'}`,
      `Can Acquire Token: ${diagnostics.canAcquireToken ? '✅' : '❌'}`,
    ];

    if (diagnostics.userId) {
      lines.push(`User ID: ${diagnostics.userId}`);
    }

    if (diagnostics.tokenSource) {
      lines.push(`Token Source: ${diagnostics.tokenSource}`);
    }

    if (diagnostics.tokenExpiry) {
      const expiryDate = new Date(diagnostics.tokenExpiry);
      const isExpired = expiryDate < new Date();
      lines.push(`Token Expiry: ${expiryDate.toISOString()} ${isExpired ? '(EXPIRED)' : '(valid)'}`);
    }

    if (diagnostics.errors.length > 0) {
      lines.push('');
      lines.push('Errors:');
      diagnostics.errors.forEach(error => {
        lines.push(`  ❌ ${error}`);
      });
    }

    if (diagnostics.canAcquireToken && diagnostics.errors.length === 0) {
      lines.push('');
      lines.push('✅ Authentication system appears to be working correctly');
    } else {
      lines.push('');
      lines.push('❌ Authentication issues detected - see errors above');
      lines.push('');
      lines.push('Suggested fixes:');
      lines.push('1. Sign out and sign back in to the extension');
      lines.push('2. Make sure you are signed in to hireall.app in another tab');
      lines.push('3. Try refreshing the page');
      lines.push('4. Restart the extension if issues persist');
    }

    return lines.join('\n');
  }

  static logDiagnosticsToConsole(): void {
    this.runDiagnostics().then(diagnostics => {
      console.group('🔍 HireAll Extension Authentication Diagnostics');
      console.log(this.formatDiagnostics(diagnostics));
      console.groupEnd();
    });
  }
}

// Make diagnostic function available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).hireallAuthDiagnostics = () => AuthDiagnostics.logDiagnosticsToConsole();
  (window as any).hireallAuthRepair = () => AuthDiagnostics.attemptAuthRepair();
}
