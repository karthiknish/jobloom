import { authManager } from "../components/Auth/AuthManager";
import { jobManager } from "../components/Jobs/JobManager";
import { settingsManager } from "../components/Settings/SettingsManager";
import { popupUI } from "../components/UI/PopupUI";
import { sanitizeBaseUrl, DEFAULT_WEB_APP_URL } from "../constants";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  onAuthStateChanged,
  sendPasswordReset
} from '../firebase';

export class PopupController {
  private static instance: PopupController;
  private isInitialized = false;

  private constructor() { }

  public static getInstance(): PopupController {
    if (!PopupController.instance) {
      PopupController.instance = new PopupController();
    }
    return PopupController.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Show loading state during initialization
      popupUI.showSkeletonLoader(true);
      popupUI.toggleGlobalLoading(true);

      // Initialize settings first
      await settingsManager.loadSettings();

      // Setup event listeners
      this.setupEventListeners();

      // Try to sync auth state from web app first
      const syncedFromWebApp = await authManager.attemptSyncFromWebApp();

      // Load initial data if authenticated (either from sync or existing Firebase state)
      if (authManager.isAuthenticated()) {
        await this.loadInitialData();
      }

      this.isInitialized = true;

    } catch (error) {
      console.error('Error initializing popup controller:', error);
      popupUI.showError('Failed to initialize popup');
    } finally {
      popupUI.showSkeletonLoader(false);
      popupUI.toggleGlobalLoading(false);
    }
  }

  private setupEventListeners(): void {
    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = (tab as HTMLElement).dataset.tab;
        if (targetTab) {
          popupUI.switchTab(targetTab);

          // Load data when switching to jobs tab
          if (targetTab === 'jobs' && authManager.isAuthenticated()) {
            jobManager.loadJobs();
          }
        }
      });
    });

    // Job filters
    document.querySelectorAll('.filter-pill').forEach(filter => {
      filter.addEventListener('click', () => {
        const filterType = (filter as HTMLElement).dataset.filter;
        if (filterType !== undefined) {
          jobManager.loadJobs(filterType);
        }
      });
    });

    // Settings event listeners
    settingsManager.setupEventListeners();

    // Auth forms
    this.setupAuthEventListeners();

    // Global functions (for onclick handlers in HTML)
    this.setupGlobalFunctions();

    // Sync Button
    document.getElementById('sync-btn')?.addEventListener('click', () => {
      this.handleSync();
    });

    // Forgot Password
    document.getElementById('forgot-password-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleForgotPassword();
    });
  }

  private setupAuthEventListeners(): void {
    let isSignUp = false;
    const submitBtn = document.getElementById('email-auth-submit');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const toggleText = document.getElementById('auth-toggle-text');
    const formTitle = document.querySelector('#auth-view h2');

    // Toggle Sign In / Sign Up
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        isSignUp = !isSignUp;

        if (submitBtn) submitBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';
        if (toggleBtn) toggleBtn.textContent = isSignUp ? 'Sign In' : 'Sign Up';
        if (toggleText) toggleText.textContent = isSignUp ? 'Already have an account?' : "Don't have an account?";
        if (formTitle) formTitle.textContent = isSignUp ? 'Create Account' : 'Welcome Back';

        authManager.clearAuthMessages();
      });
    }

    // Form Submission
    const emailForm = document.getElementById('email-auth-form');
    if (emailForm) {
      emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = popupUI.getElementValue('auth-email');
        const password = popupUI.getElementValue('auth-password');

        if (!email || !password) {
          popupUI.showError('Please enter both email and password');
          popupUI.shakeElement('auth-form-container');
          return;
        }

        popupUI.setAuthLoading(true);
        try {
          if (isSignUp) {
            if (password.length < 6) {
              popupUI.showError('Password must be at least 6 characters long');
              popupUI.shakeElement('auth-form-container');
              return;
            }
            await authManager.signUp(email, password);
          } else {
            await authManager.signIn(email, password);
          }
        } catch (error) {
          console.error('Auth error:', error);
          popupUI.shakeElement('auth-form-container');
        } finally {
          popupUI.setAuthLoading(false);
        }
      });
    }

    // Google sign in
    const googleSignInBtn = document.getElementById('google-auth-btn');
    if (googleSignInBtn) {
      googleSignInBtn.addEventListener('click', () => {
        authManager.signInWithGoogle();
      });
    }

    // Sign out
    const signOutBtn = document.getElementById('signout-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        authManager.signOut();
      });
    }

    // Clear auth messages when typing
    ['auth-email', 'auth-password'].forEach(inputId => {
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (input) {
        input.addEventListener('input', () => {
          authManager.clearAuthMessages();
        });
      }
    });
  }

  private setupGlobalFunctions(): void {
    // Make functions globally available for HTML onclick handlers
    (window as any).changeJobStatus = (jobId: string, newStatus: string) => {
      jobManager.changeJobStatus(jobId, newStatus);
    };

    (window as any).checkJobSponsor = (jobId: string, companyName: string) => {
      jobManager.checkJobSponsor(jobId, companyName);
    };

    (window as any).openJobUrl = (url: string) => {
      chrome.tabs.create({ url });
    };

    (window as any).saveExtensionSettings = () => {
      settingsManager.saveSettings();
    };

    (window as any).resetSettings = () => {
      if (confirm('Are you sure you want to reset all settings to defaults?')) {
        settingsManager.resetToDefaults();
      }
    };

    (window as any).exportSettings = () => {
      settingsManager.exportSettings();
    };

    (window as any).importSettings = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          settingsManager.importSettings(file);
        }
      };
      input.click();
    };
  }

  private async loadInitialData(): Promise<void> {
    if (!authManager.isAuthenticated()) return;

    popupUI.showSkeletonLoader(true);
    try {
      await jobManager.loadJobs();
      await this.loadStats();
    } catch (error) {
      console.error('Error loading initial data:', error);
      popupUI.showError('Failed to load jobs');
    } finally {
      popupUI.showSkeletonLoader(false);
    }
  }

  private async handleSync() {
    if (!authManager.isAuthenticated()) return;

    popupUI.setSyncing(true);
    try {
      await jobManager.loadJobs();
      await this.loadStats();
      popupUI.showSuccess('Jobs synced successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      popupUI.showError('Failed to sync jobs');
    } finally {
      popupUI.setSyncing(false);
    }
  }

  private async handleForgotPassword() {
    const emailInput = document.getElementById('auth-email') as HTMLInputElement;
    const email = emailInput.value.trim();

    if (!email) {
      popupUI.showError('Please enter your email address first');
      emailInput.focus();
      return;
    }

    try {
      await sendPasswordReset(email);
      popupUI.showSuccess('Password reset email sent!');
    } catch (error: any) {
      console.error('Password reset failed:', error);
      popupUI.showError(error.message || 'Failed to send reset email');
    }
  }

  private async loadStats(): Promise<void> {
    try {
      const jobs = jobManager.getJobs();

      // Calculate stats
      const totalTracked = jobs.length;

      // Calculate jobs added this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const newJobsThisWeek = jobs.filter(job => {
        if (!job.dateAdded) return false;
        const addedDate = new Date(job.dateAdded);
        return addedDate >= oneWeekAgo;
      }).length;

      // Update UI
      popupUI.setElementText('jobs-count-display', totalTracked.toString());

      const weeklyDisplay = document.getElementById('weekly-count-display');
      if (weeklyDisplay) {
        weeklyDisplay.textContent = `+${newJobsThisWeek}`;
      }

    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  public async refreshData(): Promise<void> {
    if (!authManager.isAuthenticated()) return;

    try {
      await this.loadInitialData();
      popupUI.showSuccess('Data refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
      popupUI.showError('Failed to refresh data');
    }
  }


  public async openBoard(): Promise<void> {
    try {
      const settings = await settingsManager.getSettings();
      const url = sanitizeBaseUrl(settings.webAppUrl || DEFAULT_WEB_APP_URL);
      chrome.tabs.create({ url });
    } catch (error) {
      console.error('Error opening board:', error);
      popupUI.showError('Failed to open job board');
    }
  }

  // Handle extension updates
  public async handleExtensionUpdate(): Promise<void> {
    try {
      // Clear any cached data
      chrome.storage.local.remove(['cachedJobs', 'lastSyncTime']);

      // Reload settings
      await settingsManager.loadSettings();

      // Refresh data if authenticated
      if (authManager.isAuthenticated()) {
        await this.refreshData();
      }

      popupUI.showSuccess('Extension updated successfully');

    } catch (error) {
      console.error('Error handling extension update:', error);
      popupUI.showError('Extension update completed with warnings');
    }
  }
}

// Export singleton instance
export const popupController = PopupController.getInstance();
