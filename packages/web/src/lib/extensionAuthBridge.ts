/**
 * Extension Auth Bridge
 * Handles authentication sharing between web app and Chrome extension
 */

import { getAuthClient } from '@/firebase/client';
import {
  safeLocalStorageGet,
  safeLocalStorageRemove,
  safeLocalStorageSet,
} from '@/utils/safeBrowserStorage';

interface ExtensionAuthMessage {
  action: 'getAuthToken' | 'authSuccess' | 'syncAuthState';
  forceRefresh?: boolean;
  token?: string;
  userId?: string;
  userEmail?: string;
}

interface ExtensionAuthResponse {
  token?: string;
  userId?: string;
  userEmail?: string;
  success?: boolean;
  error?: string;
}

class ExtensionAuthBridge {
  private static instance: ExtensionAuthBridge;
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): ExtensionAuthBridge {
    if (!ExtensionAuthBridge.instance) {
      ExtensionAuthBridge.instance = new ExtensionAuthBridge();
    }
    return ExtensionAuthBridge.instance;
  }

  private initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    // Listen for messages from extension
    window.addEventListener('message', this.handleExtensionMessage.bind(this));
    
    // Listen for auth state changes and notify extension
    this.setupAuthStateListener();
    
    // Expose Firebase auth object for extension content script access
    const auth = getAuthClient();
    if (auth) {
      (window as any).__firebase_auth = auth;
    }
    
    // Set up global function for extension to call
    // Make it return a Promise that the extension can await
    (window as any).getHireallAuthToken = async (forceRefresh?: boolean): Promise<ExtensionAuthResponse> => {
      return this.getAuthToken(forceRefresh);
    };
    
    // Also expose a sync version for localStorage fallback
    this.storeCurrentToken();
    
    this.isInitialized = true;
    console.log('[ExtensionAuthBridge] Initialized');
  }
  
  private async storeCurrentToken(): Promise<void> {
    try {
      const auth = getAuthClient();
      if (!auth?.currentUser) return;
      
      const token = await auth.currentUser.getIdToken();
      if (token) {
        safeLocalStorageSet('hireall_auth_token', token);
        safeLocalStorageSet('hireall_user_data', JSON.stringify({
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.warn('[ExtensionAuthBridge] Failed to store initial token:', error);
    }
  }

  private handleExtensionMessage(event: MessageEvent): void {
    // Only accept messages from same origin for security
    if (event.origin !== window.location.origin) return;

    const message = event.data as ExtensionAuthMessage;
    if (!message.action) return;

    switch (message.action) {
      case 'getAuthToken':
        this.handleGetAuthToken(message);
        break;
      case 'syncAuthState':
        this.handleSyncAuthState();
        break;
    }
  }

  private async handleGetAuthToken(message: ExtensionAuthMessage): Promise<void> {
    try {
      const authResponse = await this.getAuthToken(message.forceRefresh);
      
      // Send response back to extension
      window.postMessage({
        type: 'HIREDALL_AUTH_RESPONSE',
        ...authResponse,
        timestamp: Date.now()
      }, '*');
      
      // Also try to send via chrome runtime if available
      const chromeRuntime = (window as any).chrome?.runtime;
      if (chromeRuntime?.sendMessage) {
        try {
          chromeRuntime.sendMessage({
            action: 'authSuccess',
            data: authResponse,
            timestamp: Date.now()
          }, (response: any) => {
            if (chromeRuntime.lastError) {
              console.warn('[ExtensionAuthBridge] Chrome runtime message failed:', chromeRuntime.lastError);
            }
          });
        } catch (error) {
          console.warn('[ExtensionAuthBridge] Failed to send chrome runtime message:', error);
        }
      }
    } catch (error) {
      console.error('[ExtensionAuthBridge] Error handling get auth token:', error);
      
      window.postMessage({
        type: 'HIREDALL_AUTH_RESPONSE',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      }, '*');
    }
  }

  private async handleSyncAuthState(): Promise<void> {
    try {
      const authResponse = await this.getAuthToken(true);
      
      // Notify extension of auth state change
      window.postMessage({
        type: 'HIREDALL_AUTH_STATE_CHANGED',
        isAuthenticated: !!authResponse.token,
        ...authResponse,
        timestamp: Date.now()
      }, '*');
    } catch (error) {
      console.error('[ExtensionAuthBridge] Error syncing auth state:', error);
    }
  }

  private setupAuthStateListener(): void {
    const auth = getAuthClient();
    if (!auth) return;

    import('firebase/auth').then(({ onAuthStateChanged }) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const token = await user.getIdToken();
            const authResponse: ExtensionAuthResponse = {
              token,
              userId: user.uid,
              userEmail: user.email || undefined,
              success: true
            };

            // Notify extension of auth state change
            window.postMessage({
              type: 'HIREDALL_AUTH_STATE_CHANGED',
              isAuthenticated: true,
              ...authResponse,
              timestamp: Date.now()
            }, '*');

            // Store in localStorage for extension access
            safeLocalStorageSet('hireall_auth_token', token);
            safeLocalStorageSet('hireall_user_data', JSON.stringify({
              userId: user.uid,
              userEmail: user.email,
              timestamp: Date.now()
            }));

          } catch (error) {
            console.error('[ExtensionAuthBridge] Error getting token after auth change:', error);
          }
        } else {
          // User signed out
          window.postMessage({
            type: 'HIREDALL_AUTH_STATE_CHANGED',
            isAuthenticated: false,
            timestamp: Date.now()
          }, '*');

          safeLocalStorageRemove('hireall_auth_token');
          safeLocalStorageRemove('hireall_user_data');
        }
      });

      // Cleanup on page unload
      window.addEventListener('beforeunload', unsubscribe);
    });
  }

  public async getAuthToken(forceRefresh = false): Promise<ExtensionAuthResponse> {
    try {
      const auth = getAuthClient();
      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }

      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: 'No authenticated user' };
      }

      let token: string;
      try {
        token = await user.getIdToken(forceRefresh);
      } catch (networkError: any) {
        // If network refresh fails, try to get cached token
        if (forceRefresh && networkError?.code === 'auth/network-request-failed') {
          console.warn('[ExtensionAuthBridge] Network error, falling back to cached token');
          token = await user.getIdToken(false);
        } else {
          throw networkError;
        }
      }
      
      return {
        token,
        userId: user.uid,
        userEmail: user.email || undefined,
        success: true
      };
    } catch (error) {
      console.error('[ExtensionAuthBridge] Error getting auth token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public isExtensionAvailable(): boolean {
    return typeof (window as any).chrome?.runtime !== 'undefined';
  }
}

// Export singleton instance
export const extensionAuthBridge = ExtensionAuthBridge.getInstance();

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  extensionAuthBridge;
}
