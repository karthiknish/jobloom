import {
  getAuthInstance,
  getGoogleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "../../firebase";
import { cacheAuthToken, clearCachedAuthToken, acquireIdToken, getCachedUserInfo, setSessionProof, clearSessionProof } from "../../authToken";
import { ExtensionMessageHandler } from "../ExtensionMessageHandler";
import { sanitizeBaseUrl, DEFAULT_WEB_APP_URL } from "../../constants";
import { get, post } from "../../apiClient";
import { popupUI } from "../UI/PopupUI";

// Enhanced validation functions
const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return "Email is required";
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  if (email.length > 254) return "Email address is too long";

  // Check for suspicious email patterns
  const suspiciousPatterns = [
    /^[0-9]+@/, // Numbers-only local part
    /.*\.{2,}.*/, // Multiple consecutive dots
    /.*@.*\.{2,}$/, // Multiple dots in domain
  ];
  if (suspiciousPatterns.some(pattern => pattern.test(email))) {
    return "Please enter a valid email address";
  }

  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  if (password.length > 128) return "Password is too long";

  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456', 'qwerty', 'admin', 'letmein', 'welcome',
    'monkey', 'dragon', 'master', 'sunshine', 'princess', 'football'
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    return "Please choose a stronger password";
  }

  return null;
};

export class AuthManager {
  private static instance: AuthManager;
  private currentUser: any = null;
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private initialize(): void {
    if (this.isInitialized) return;

    // Listen for auth state changes
    onAuthStateChanged(getAuthInstance(), async (user) => {
      this.currentUser = user;
      await this.syncAuthState();
      this.updateAuthUI(!!user);
    });

    this.isInitialized = true;
  }

  public async signIn(email: string, password: string): Promise<void> {
    try {
      // Enhanced validation
      const emailError = validateEmail(email);
      const passwordError = validatePassword(password);

      if (emailError) {
        this.showAuthError(emailError);
        return;
      }

      if (passwordError) {
        this.showAuthError(passwordError);
        return;
      }

      clearCachedAuthToken();

      const userCredential = await signInWithEmailAndPassword(
        getAuthInstance(),
        email,
        password
      );

      // Note: Email verification check removed - Firebase handles this if configured in console
      // Users can sign in without verified email; app features can check emailVerified if needed

      const token = await userCredential.user.getIdToken();
      cacheAuthToken({
        token,
        userId: userCredential.user.uid,
        userEmail: userCredential.user.email,
        source: 'popup'
      });

      const sessionOk = await this.establishServerSession(token);
      if (!sessionOk) {
        await clearSessionProof();
        await clearCachedAuthToken();
        this.showAuthError('Session validation failed. Please sign in again.');
        return;
      }

      this.currentUser = userCredential.user;
      this.updateAuthUI(true);

      popupUI.showSuccess('Successfully signed in!');
      popupUI.switchTab('jobs');

    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = 'Failed to sign in. Please try again';

      // Enhanced error handling
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later or reset your password';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid credentials. Please check your email and password';
          break;
        default:
          errorMessage = error.message || 'Sign in failed. Please try again';
      }

      this.showAuthError(errorMessage);
    }
  }

  public async signUp(email: string, password: string): Promise<void> {
    try {
      // Enhanced validation
      const emailError = validateEmail(email);
      const passwordError = validatePassword(password);

      if (emailError) {
        this.showAuthError(emailError);
        return;
      }

      if (passwordError) {
        this.showAuthError(passwordError);
        return;
      }

      // Check if password is same as email
      if (password.toLowerCase() === email.toLowerCase()) {
        this.showAuthError('Password cannot be the same as your email');
        return;
      }

      clearCachedAuthToken();

      const userCredential = await createUserWithEmailAndPassword(
        getAuthInstance(),
        email,
        password
      );

      const token = await userCredential.user.getIdToken();
      cacheAuthToken({
        token,
        userId: userCredential.user.uid,
        userEmail: userCredential.user.email,
        source: 'popup'
      });

      const sessionOk = await this.establishServerSession(token);
      if (!sessionOk) {
        await clearSessionProof();
        await clearCachedAuthToken();
        this.showAuthError('Session validation failed. Please try again.');
        return;
      }

      this.currentUser = userCredential.user;
      this.updateAuthUI(true);

      popupUI.showSuccess('Account created successfully! Please check your email for verification.');
      popupUI.switchTab('jobs');

    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = 'Failed to create account. Please try again';

      // Enhanced error handling
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists. Try signing in instead';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many sign-up attempts. Please try again later';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled. Please contact support';
          break;
        default:
          errorMessage = error.message || 'Sign up failed. Please try again';
      }

      this.showAuthError(errorMessage);
    }
  }

  public async signInWithGoogle(): Promise<void> {
    try {
      popupUI.showLoading('google-auth-btn');

      // Run OAuth in the background service worker.
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        throw new Error('Chrome runtime messaging not available');
      }

      // Clear any old errors before starting
      await new Promise<void>((resolve) => {
        chrome.storage.local.remove(['hireallLastGoogleSignInError'], () => resolve());
      });

      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ action: 'googleSignIn' }, (resp) => {
          if (chrome.runtime?.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(resp);
        });
      });

      if (!response?.success) {
        throw new Error(response?.error || 'Google sign-in failed');
      }

      // Background returns { success: true, started: true } immediately and runs OAuth async.
      // Wait for completion via AUTH_STATE_CHANGED message or polling for errors.
      if (response?.started) {
        const maxWaitMs = 30000; // 30 seconds max wait
        const pollIntervalMs = 300;
        const startTime = Date.now();

        // Set up listener for auth state change from background
        let authCompleted = false;
        let authError: string | null = null;

        const authListener = (message: any) => {
          if (message?.type === 'AUTH_STATE_CHANGED') {
            if (message.payload?.isAuthenticated) {
              authCompleted = true;
            }
          }
        };

        chrome.runtime.onMessage.addListener(authListener);

        try {
          while (Date.now() - startTime < maxWaitMs) {
            // Check if auth completed via message
            if (authCompleted) {
              await this.attemptSyncFromWebApp();
              popupUI.showSuccess('Signed in with Google!');
              popupUI.switchTab('jobs');
              return;
            }

            // Check for stored errors from background
            const errorCheck = await new Promise<{ hireallLastGoogleSignInError?: { message: string; at: number } }>((resolve) => {
              chrome.storage.local.get(['hireallLastGoogleSignInError'], (result) => {
                resolve(result);
              });
            });

            if (errorCheck.hireallLastGoogleSignInError?.message) {
              // Only process errors from after we started
              if (errorCheck.hireallLastGoogleSignInError.at >= startTime) {
                authError = errorCheck.hireallLastGoogleSignInError.message;
                chrome.storage.local.remove(['hireallLastGoogleSignInError']);
                break;
              }
            }

            // Also check auth state directly
            if (this.isAuthenticated()) {
              popupUI.showSuccess('Signed in with Google!');
              popupUI.switchTab('jobs');
              return;
            }

            await new Promise(r => setTimeout(r, pollIntervalMs));
          }
        } finally {
          chrome.runtime.onMessage.removeListener(authListener);
        }

        if (authError) {
          throw new Error(authError);
        }

        // Timeout - show message but don't keep loading forever
        popupUI.showSuccess('Sign-in timed out. Try reopening the extension.');
        return;
      }

      // Legacy path: direct success response
      await this.attemptSyncFromWebApp();
      if (this.isAuthenticated()) {
        popupUI.showSuccess('Signed in with Google!');
        popupUI.switchTab('jobs');
      } else {
        popupUI.showError('Sign-in failed. Please try again.');
      }

    } catch (error: any) {
      console.error('Google sign in error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Google sign-in failed. Please try again.';
      if (error?.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid credentials. Please try signing in again.';
      } else if (error?.message?.includes('Identity API') || error?.message?.includes('runtime messaging')) {
        errorMessage = 'Google sign-in not available in this context.';
      } else if (error?.message?.includes('user denied') || error?.message?.includes('cancelled') || error?.message?.includes('canceled')) {
        errorMessage = 'Sign-in was cancelled.';
      } else if (error?.message?.includes('browser sign-in')) {
        errorMessage = 'Please sign in to Chrome browser first, then try again.';
      } else if (error?.message?.includes('Auth not ready') || error?.message?.includes('auth token')) {
        errorMessage = 'Chrome sign-in required. Please sign in to Chrome, then try again.';
      } else if (typeof error?.message === 'string' && error.message.length) {
        errorMessage = error.message;
      }
      
      this.showAuthError(errorMessage);
    } finally {
      popupUI.hideLoading('google-auth-btn');
    }
  }

  public async signOut(): Promise<void> {
    try {
      popupUI.showLoading('signout-btn');

      // Clear local state first for immediate UI feedback
      this.currentUser = null;
      this.updateAuthUI(false);

      // Clear cached auth token
      clearCachedAuthToken();
      await clearSessionProof();

      // Clear any additional stored data
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          // Clear any sensitive data from storage
          chrome.storage.local.remove([
            'hireallAuthToken',
            'hireallUserData',
            'hireallSessionData'
          ]);
        }
      } catch (storageError) {
        console.warn('Failed to clear storage during sign out:', storageError);
      }

      // Sign out from Firebase
      await firebaseSignOut(getAuthInstance());

      popupUI.showSuccess('Successfully signed out');
      popupUI.switchTab('auth');

    } catch (error: any) {
      console.error('Sign out error:', error);

      // Even if sign out fails, try to clear local state
      this.currentUser = null;
      this.updateAuthUI(false);
      clearCachedAuthToken();

      let errorMessage = 'Failed to sign out completely';
      if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error during sign out. Local data has been cleared.';
      }

      popupUI.showError(errorMessage);
      popupUI.switchTab('auth');
    } finally {
      popupUI.hideLoading('signout-btn');
    }
  }

  public async syncAuthState(): Promise<void> {
    if (!this.currentUser) {
      this.updateAuthUI(false);
      return;
    }

    try {
      const token = await this.currentUser.getIdToken(true);
      await cacheAuthToken({
        token,
        userId: this.currentUser.uid,
        userEmail: this.currentUser.email,
        source: 'popup'
      });

      // Ensure server-side session is established for parity with web app
      const sessionOk = await this.establishServerSession(token);
      if (!sessionOk) {
        await clearSessionProof();
        await clearCachedAuthToken();
        this.updateAuthUI(false);
        popupUI.showError('Session validation failed. Please sign in again.');
        return;
      }

      // Store in sync storage for other extension components
      if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
        await chrome.storage.sync.set({
          firebaseUid: this.currentUser.uid,
          userId: this.currentUser.uid,
          userEmail: this.currentUser.email
        });
      }

      // Notify background script about auth state
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'AUTH_STATE_CHANGED',
          payload: {
            isAuthenticated: true,
            userId: this.currentUser.uid,
            email: this.currentUser.email,
            token: token,
            source: 'popup'
          }
        }).catch((error) => {
          console.debug('Failed to notify background of auth state:', error);
        });
      }

    } catch (error) {
      console.error('Auth sync error:', error);
      this.updateAuthUI(false);
    }
  }

  public async attemptSyncFromWebApp(): Promise<boolean> {
    try {
      console.debug('AuthManager: Attempting to sync auth from web app...');

      // First try cached token (e.g., set by background Google sign-in).
      // NOTE: forceRefresh=true intentionally bypasses the cache, which makes the popup look signed out
      // right after a successful background sign-in.
      let token = await acquireIdToken(false, { skipMessageFallback: false });
      if (!token) {
        // If no cached token exists, try a forced refresh (tab/background fallback paths).
        token = await acquireIdToken(true, { skipMessageFallback: false });
      }
      if (!token) {
        console.debug('AuthManager: No token acquired from web app');
        return false;
      }

      const sessionOk = await this.establishServerSession(token);
      if (!sessionOk) {
        console.warn('AuthManager: Server session validation failed');
        popupUI.showError('Please re-sign in to validate your session');
        return false;
      }

      console.debug('AuthManager: Token acquired, checking cached user info...');

      // Get user info from cached token (this works even when auth.currentUser is null)
      const cachedInfo = await getCachedUserInfo();
      
      if (cachedInfo?.isValid && cachedInfo.userId) {
        // We have valid cached user info - use it directly
        // Create a pseudo-user object for the UI
        this.currentUser = {
          uid: cachedInfo.userId,
          email: cachedInfo.userEmail || null,
          displayName: null,
          emailVerified: true, // Assume verified if they have a valid token
          photoURL: null
        };

        // Store in sync storage
        if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
          await chrome.storage.sync.set({
            firebaseUid: cachedInfo.userId,
            userId: cachedInfo.userId,
            userEmail: cachedInfo.userEmail
          });
        }

        this.updateAuthUI(true);

        // Notify background script about successful sync
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          chrome.runtime.sendMessage({
            type: 'AUTH_STATE_CHANGED',
            payload: {
              isAuthenticated: true,
              userId: cachedInfo.userId,
              email: cachedInfo.userEmail,
              token: token,
              source: 'webapp_sync'
            }
          }).catch((err) => {
            console.debug('Failed to notify background:', err);
          });
        }

        popupUI.showSuccess('Synced with web app');
        popupUI.switchTab('jobs');
        return true;
      }

      // Fallback: Check if Firebase auth has a user (for direct extension sign-in)
      const auth = getAuthInstance();
      if (auth.currentUser) {
        this.currentUser = auth.currentUser;
        this.updateAuthUI(true);
        popupUI.showSuccess('Signed in');
        popupUI.switchTab('jobs');
        return true;
      }

      console.debug('AuthManager: No valid user info found');
      return false;
    } catch (error) {
      console.error('Sync from web app error:', error);
      // Don't show error if it's just a normal "not logged in" scenario
      if ((error as any)?.code !== 'AUTH_REQUIRED') {
        popupUI.showError('Failed to sync with web app');
      }
      return false;
    }
  }

  private async establishServerSession(idToken: string): Promise<boolean> {
    try {
      // Prime CSRF cookie if needed; ignore errors because extensions may be exempt.
      try {
        await get('/api/auth/session', undefined, true, { retries: 0, timeout: 8000 });
      } catch (csrfError) {
        console.debug('AuthManager: CSRF preflight skipped/failed', csrfError);
      }

      const response = await post<{ ok?: boolean; uid?: string; sessionHash?: string; expiresAt?: number }>(
        '/api/auth/session',
        { idToken },
        true,
        { retries: 0, timeout: 15000 }
      );

      if (response && typeof response === 'object' && response.ok === true) {
        if (response.sessionHash) {
          const expiresAt = typeof response.expiresAt === 'number'
            ? response.expiresAt
            : Date.now() + 7 * 24 * 60 * 60 * 1000;
          await setSessionProof({ sessionHash: response.sessionHash, expiresAt });
        }
        return true;
      }

      return false;
    } catch (error) {
      console.warn('AuthManager: Failed to establish server session', error);
      await clearSessionProof();
      await clearCachedAuthToken();
      return false;
    }
  }

  public getCurrentUser(): any {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  private updateAuthUI(isAuthenticated: boolean): void {
    const mainTabs = document.querySelectorAll('.nav-item:not([data-tab="auth"])');
    const formContainer = document.getElementById("auth-form-container") as HTMLElement;
    const logoutSection = document.getElementById("logout-section") as HTMLElement;

    if (isAuthenticated) {
      // Hide login form and show profile/logout section
      // Must remove 'hidden' class since it uses !important
      if (formContainer) {
        formContainer.style.display = "none";
        formContainer.classList.add("hidden");
      }
      if (logoutSection) {
        logoutSection.classList.remove("hidden");
        logoutSection.style.display = "block";
      }

      if (this.currentUser) {
        popupUI.updateUserProfile({
          email: this.currentUser.email,
          photoUrl: this.currentUser.photoURL,
          displayName: this.currentUser.displayName
        });
      }

      mainTabs.forEach(tab => {
        (tab as HTMLElement).style.display = "flex"; // Flex for nav items
      });

      // If we are on auth tab, switch to jobs
      const activeTab = document.querySelector('.nav-item.active');
      if (activeTab && (activeTab as HTMLElement).dataset.tab === 'auth') {
        popupUI.switchTab('jobs');
      }

    } else {
      // Show login form and hide profile/logout section
      if (formContainer) {
        formContainer.classList.remove("hidden");
        formContainer.style.display = "block";
      }
      if (logoutSection) {
        logoutSection.style.display = "none";
        logoutSection.classList.add("hidden");
      }

      mainTabs.forEach(tab => {
        // Hide other tabs if not authenticated
        (tab as HTMLElement).style.display = "none";
      });

      // Force switch to auth tab
      popupUI.switchTab('auth');
    }
  }


  private showAuthError(message: string): void {
    // Only show toast notification - no inline error message
    popupUI.showError(message);
  }

  private showAuthSuccess(message: string): void {
    const authError = document.getElementById("auth-error") as HTMLElement;
    const authSuccess = document.getElementById("auth-success") as HTMLElement;

    // Hide error message
    if (authError) {
      authError.style.display = "none";
      authError.classList.add("hidden");
    }

    // Show success message
    if (authSuccess) {
      authSuccess.textContent = message;
      authSuccess.style.display = "block";
      authSuccess.classList.remove("hidden");
    }
  }

  public clearAuthMessages(): void {
    const authError = document.getElementById("auth-error") as HTMLElement;
    const authSuccess = document.getElementById("auth-success") as HTMLElement;

    if (authError) {
      authError.style.display = "none";
      authError.classList.add("hidden");
    }
    if (authSuccess) {
      authSuccess.style.display = "none";
      authSuccess.classList.add("hidden");
    }
  }
}

// Export singleton instance
export const authManager = AuthManager.getInstance();
