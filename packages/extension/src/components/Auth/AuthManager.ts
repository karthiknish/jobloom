import { 
  getAuthInstance, 
  getGoogleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithPopup,
} from "../../firebase";
import { cacheAuthToken, clearCachedAuthToken, acquireIdToken } from "../../authToken";
import { ExtensionMessageHandler } from "../ExtensionMessageHandler";
import { sanitizeBaseUrl, DEFAULT_WEB_APP_URL } from "../../constants";
import { get } from "../../apiClient";
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
      popupUI.showLoading('sign-in-btn');
      
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
      
      // Verify email is verified
      if (!userCredential.user.emailVerified) {
        this.showAuthError('Please verify your email before signing in');
        return;
      }
      
      const token = await userCredential.user.getIdToken();
      cacheAuthToken({ 
        token,
        userId: userCredential.user.uid,
        userEmail: userCredential.user.email,
        source: 'popup'
      });
      
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
    } finally {
      popupUI.hideLoading('sign-in-btn');
    }
  }
  
  public async signUp(email: string, password: string): Promise<void> {
    try {
      popupUI.showLoading('sign-up-btn');
      
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
    } finally {
      popupUI.hideLoading('sign-up-btn');
    }
  }
  
  public async signInWithGoogle(): Promise<void> {
    try {
      popupUI.showLoading('google-sign-in-btn');
      clearCachedAuthToken();
      
      const result = await signInWithPopup(getAuthInstance(), getGoogleProvider());
      const token = await result.user.getIdToken();
      
      cacheAuthToken({ 
        token,
        userId: result.user.uid,
        userEmail: result.user.email,
        source: 'popup'
      });
      
      this.currentUser = result.user;
      this.updateAuthUI(true);
      
      popupUI.showSuccess('Successfully signed in with Google!');
      popupUI.switchTab('jobs');
      
    } catch (error: any) {
      console.error('Google sign in error:', error);
      let errorMessage = 'Failed to sign in with Google. Please try again';
      
      // Enhanced error handling
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in popup was closed before completion';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Sign-in popup was blocked by your browser. Please allow popups';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Sign-in was cancelled';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again';
          break;
        case 'auth/popup-request-failed':
          errorMessage = 'Failed to open sign-in popup. Please try again';
          break;
        default:
          errorMessage = error.message || 'Google sign-in failed. Please try again';
      }
      
      this.showAuthError(errorMessage);
    } finally {
      popupUI.hideLoading('google-sign-in-btn');
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
      cacheAuthToken({ token });
      
      // Notify background script about auth state
      chrome.runtime.sendMessage({
        type: 'AUTH_STATE_CHANGED',
        payload: {
          isAuthenticated: true,
          userId: this.currentUser.uid,
          email: this.currentUser.email,
          token: token
        }
      });
      
    } catch (error) {
      console.error('Auth sync error:', error);
      this.updateAuthUI(false);
    }
  }
  
  public async attemptSyncFromWebApp(): Promise<boolean> {
    try {
      // First try to get token from web app tabs
      const token = await acquireIdToken(true, { skipMessageFallback: true });
      if (!token) return false;
      
      // Update current user state
      const auth = getAuthInstance();
      if (auth.currentUser) {
        this.currentUser = auth.currentUser;
        this.updateAuthUI(true);
        
        // Notify background script about successful sync
        chrome.runtime.sendMessage({
          type: 'AUTH_STATE_CHANGED',
          payload: {
            isAuthenticated: true,
            userId: this.currentUser.uid,
            email: this.currentUser.email,
            token: token,
            source: 'webapp_sync'
          }
        });
        
        popupUI.showSuccess('Authentication synchronized with web app');
        popupUI.switchTab('jobs');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Sync from web app error:', error);
      popupUI.showError('Failed to sync with web app');
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
    const authStatus = document.getElementById("auth-status") as HTMLElement;
    const statusDot = authStatus?.querySelector(".status-dot") as HTMLElement;
    const statusText = authStatus?.querySelector(".status-text") as HTMLElement;
    const authTab = document.querySelector('.nav-tab[data-tab="auth"]') as HTMLElement;
    const mainTabs = document.querySelectorAll('.nav-tab:not([data-tab="auth"])');
    const formContainer = document.getElementById("auth-form-container") as HTMLElement;
    const logoutSection = document.getElementById("logout-section") as HTMLElement;
    
    if (isAuthenticated) {
      authStatus?.classList.add("authenticated");
      authStatus?.classList.remove("unauthenticated");
      
      if (statusDot) {
        statusDot.style.backgroundColor = "#22c55e";
        statusText && (statusText.textContent = "Authenticated");
      }
      
      if (formContainer) formContainer.style.display = "none";
      if (logoutSection) logoutSection.style.display = "block";
      
      mainTabs.forEach(tab => {
        (tab as HTMLElement).style.display = "inline-block";
      });
      
      if (authTab) authTab.classList.add("hidden");
    } else {
      authStatus?.classList.remove("authenticated");
      authStatus?.classList.add("unauthenticated");
      
      if (statusDot) {
        statusDot.style.backgroundColor = "#ef4444";
        statusText && (statusText.textContent = "Not Authenticated");
      }
      
      if (formContainer) formContainer.style.display = "block";
      if (logoutSection) logoutSection.style.display = "none";
      
      mainTabs.forEach(tab => {
        if ((tab as HTMLElement).dataset.tab !== 'auth') {
          (tab as HTMLElement).style.display = "none";
        }
      });
      
      if (authTab && !authTab.classList.contains("active")) {
        authTab.click();
      }
    }
  }
  
  private showAuthError(message: string): void {
    const authError = document.getElementById("auth-error") as HTMLElement;
    const authSuccess = document.getElementById("auth-success") as HTMLElement;
    
    if (authSuccess) authSuccess.style.display = "none";
    if (authError) {
      authError.textContent = message;
      authError.style.display = "block";
      popupUI.shakeElement('auth-error');
    }
  }
  
  private showAuthSuccess(message: string): void {
    const authError = document.getElementById("auth-error") as HTMLElement;
    const authSuccess = document.getElementById("auth-success") as HTMLElement;
    
    if (authError) authError.style.display = "none";
    if (authSuccess) {
      authSuccess.textContent = message;
      authSuccess.style.display = "block";
    }
  }
  
  public clearAuthMessages(): void {
    const authError = document.getElementById("auth-error") as HTMLElement;
    const authSuccess = document.getElementById("auth-success") as HTMLElement;
    
    if (authError) authError.style.display = "none";
    if (authSuccess) authSuccess.style.display = "none";
  }
}

// Export singleton instance
export const authManager = AuthManager.getInstance();
