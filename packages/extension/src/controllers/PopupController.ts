import { authManager } from "../components/Auth/AuthManager";
import { jobManager } from "../components/Jobs/JobManager";
import { settingsManager } from "../components/Settings/SettingsManager";
import { popupUI } from "../components/UI/PopupUI";
import { sanitizeBaseUrl, DEFAULT_WEB_APP_URL } from "../constants";
import { fetchSubscriptionStatus } from "../rateLimiter";
import type { SubscriptionStatus } from "../rateLimiter";
import { Onboarding } from "../components/Onboarding";
import { connectivityStatus } from "../components/ConnectivityStatus";
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
  private currentPlan: string = 'free';

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
      // Show cached job count immediately for better UX
      this.showCachedJobCount();
      
      // Show loading state during initialization
      popupUI.showSkeletonLoader(true);
      popupUI.toggleGlobalLoading(true);


      // Check if onboarding should be shown (first-time users)
      const shouldShowOnboarding = await Onboarding.shouldShow();
      if (shouldShowOnboarding) {
        const onboarding = new Onboarding({
          onComplete: () => this.loadInitialData(),
          onSkip: () => this.loadInitialData(),
        });
        (window as any).onboardingInstance = onboarding;
        onboarding.show();
      }

      // Initialize settings first
      await settingsManager.loadSettings();

      // Setup event listeners
      this.setupEventListeners();
      this.setupPremiumBannerListeners();

      // Try to sync auth state from web app first
      const syncedFromWebApp = await authManager.attemptSyncFromWebApp();

      // Load initial data if authenticated (either from sync or existing Firebase state)
      if (authManager.isAuthenticated()) {
        await this.loadInitialData();
        await this.loadSubscriptionStatus();
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
    const tabs = document.querySelectorAll('.nav-item');
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        const targetTab = (tab as HTMLElement).dataset.tab;
        if (targetTab) {
          this.handleTabSwitch(targetTab);
        }
      });

      // Keyboard navigation for tabs
      tab.addEventListener('keydown', (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        let targetIndex = -1;

        if (keyEvent.key === 'ArrowRight') {
          targetIndex = (index + 1) % tabs.length;
        } else if (keyEvent.key === 'ArrowLeft') {
          targetIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (keyEvent.key === 'Home') {
          targetIndex = 0;
        } else if (keyEvent.key === 'End') {
          targetIndex = tabs.length - 1;
        }

        if (targetIndex !== -1) {
          const targetTab = tabs[targetIndex] as HTMLElement;
          targetTab.focus();
          const tabName = targetTab.dataset.tab;
          if (tabName) {
            this.handleTabSwitch(tabName);
          }
        }
      });
    });

    // Job filters with keyboard navigation
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach((filter, index) => {
      filter.addEventListener('click', () => {
        const filterType = (filter as HTMLElement).dataset.filter;
        if (filterType !== undefined) {
          this.activateFilter(filterType, filter as HTMLElement);
        }
      });

      // Keyboard navigation for filter pills
      filter.addEventListener('keydown', (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        let targetIndex = -1;

        if (keyEvent.key === 'ArrowRight' || keyEvent.key === 'ArrowDown') {
          targetIndex = (index + 1) % filterPills.length;
          keyEvent.preventDefault();
        } else if (keyEvent.key === 'ArrowLeft' || keyEvent.key === 'ArrowUp') {
          targetIndex = (index - 1 + filterPills.length) % filterPills.length;
          keyEvent.preventDefault();
        } else if (keyEvent.key === 'Home') {
          targetIndex = 0;
          keyEvent.preventDefault();
        } else if (keyEvent.key === 'End') {
          targetIndex = filterPills.length - 1;
          keyEvent.preventDefault();
        } else if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
          const filterType = (filter as HTMLElement).dataset.filter;
          if (filterType !== undefined) {
            this.activateFilter(filterType, filter as HTMLElement);
          }
          keyEvent.preventDefault();
        }

        if (targetIndex !== -1) {
          const targetFilter = filterPills[targetIndex] as HTMLElement;
          targetFilter.focus();
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

    // Empty State Buttons
    document.getElementById('open-linkedin-btn')?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://www.linkedin.com/jobs/' });
    });

    document.getElementById('open-indeed-btn')?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://www.indeed.co.uk/jobs' });
    });

    // Retry sync event from ConnectivityStatus
    window.addEventListener('sync-retry', () => {
      this.handleSync();
    });
  }

  private activateFilter(filterType: string, clickedElement: HTMLElement): void {
    // Update aria-pressed for all filter pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
      const isActive = (pill as HTMLElement).dataset.filter === filterType;
      pill.setAttribute('aria-pressed', isActive.toString());
      pill.classList.toggle('active', isActive);
    });

    // Load filtered jobs
    jobManager.loadJobs(filterType);
  }


  private handleTabSwitch(targetTab: string): void {
    popupUI.switchTab(targetTab);

    // Update ARIA attributes
    document.querySelectorAll('.nav-item').forEach(t => {
      const isSelected = (t as HTMLElement).dataset.tab === targetTab;
      t.setAttribute('aria-selected', isSelected.toString());
    });

    // Load data when switching to jobs tab
    if (targetTab === 'jobs' && authManager.isAuthenticated()) {
      jobManager.loadJobs();
    }
  }

  private setupAuthEventListeners(): void {
    let isSignUp = false;
    const submitBtn = document.getElementById('email-auth-submit');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const toggleText = document.getElementById('auth-toggle-text');
    const formTitle = document.querySelector('#auth-content .auth-hero h2');
    const formSubtitle = document.querySelector('#auth-content .auth-hero p');
    const submitBtnText = submitBtn?.querySelector('.btn-text');

    // Toggle Sign In / Sign Up
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        isSignUp = !isSignUp;

        if (submitBtnText) {
          submitBtnText.textContent = isSignUp ? 'Sign Up' : 'Sign In';
        } else if (submitBtn) {
          // Fallback for unexpected markup; avoid breaking the UI if the span is missing.
          submitBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';
        }
        if (toggleBtn) toggleBtn.textContent = isSignUp ? 'Sign In' : 'Sign Up';
        if (toggleText) toggleText.textContent = isSignUp ? 'Already have an account?' : "Don't have an account?";
        if (formTitle) formTitle.textContent = isSignUp ? 'Create Account' : 'Welcome Back';
        if (formSubtitle) formSubtitle.textContent = isSignUp
          ? 'Create your account to sync across devices.'
          : 'Sync your job search across all devices.';

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

    // Check if online
    if (!connectivityStatus.isOnline()) {
      popupUI.showWarning('You are offline. Sync will resume when connected.');
      return;
    }

    popupUI.setSyncing(true);
    
    try {
      // Use connectivity status for retry handling
      await connectivityStatus.executeWithRetry(
        async () => {
          await jobManager.loadJobs();
          await this.loadStats();
          await connectivityStatus.updatePendingCount();
        },
        (attempt, delay) => {
          console.log(`Sync retry attempt ${attempt}, delay ${delay}ms`);
        }
      );
      
      popupUI.showSuccess('Jobs synced successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to sync jobs';
      popupUI.showError(message);
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
      const jobCountDisplay = document.getElementById('jobs-count-display');
      if (jobCountDisplay) {
        jobCountDisplay.textContent = totalTracked.toString();
        jobCountDisplay.style.opacity = '1'; // Reset from loading state
      }


      const weeklyDisplay = document.getElementById('weekly-count-display');
      if (weeklyDisplay) {
        weeklyDisplay.textContent = `+${newJobsThisWeek}`;
      }

    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  private showCachedJobCount(): void {
    // Show cached job count immediately for instant feedback
    chrome.storage.local.get(['cachedJobCount'], (result) => {
      if (result.cachedJobCount && result.cachedJobCount > 0) {
        const jobCount = document.getElementById('jobs-count-display');
        if (jobCount) {
          jobCount.textContent = result.cachedJobCount.toString();
          jobCount.style.opacity = '0.6'; // Indicate it's loading
        }
      }
    });
  }


  public async refreshData(): Promise<void> {
    if (!authManager.isAuthenticated()) return;

    try {
      await this.loadInitialData();
      await this.loadSubscriptionStatus();
      popupUI.showSuccess('Data refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
      popupUI.showError('Failed to refresh data');
    }
  }

  private setupPremiumBannerListeners(): void {
    // Premium banner dismiss button
    const dismissBtn = document.getElementById('premium-banner-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        this.dismissPremiumBanner();
      });
    }

    // Premium banner upgrade button
    const bannerUpgradeBtn = document.getElementById('premium-upgrade-btn');
    if (bannerUpgradeBtn) {
      bannerUpgradeBtn.addEventListener('click', () => {
        this.openUpgradePage();
      });
    }

    // Premium upgrade card button (in account tab)
    const upgradeNowBtn = document.getElementById('upgrade-now-btn');
    if (upgradeNowBtn) {
      upgradeNowBtn.addEventListener('click', () => {
        this.openUpgradePage();
      });
    }
  }

  private async loadSubscriptionStatus(): Promise<void> {
    try {
      const status: SubscriptionStatus | null = await fetchSubscriptionStatus();
      
      if (status) {
        // Determine plan from various possible fields
        const plan = status.plan || status.subscription?.plan || 'free';
        this.currentPlan = plan;
        this.updatePremiumUI(plan);
      } else {
        this.currentPlan = 'free';
        this.updatePremiumUI('free');
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
      // Default to free plan on error
      this.currentPlan = 'free';
      this.updatePremiumUI('free');
    }
  }

  private updatePremiumUI(plan: string): void {
    const isPremium = plan === 'premium' || plan === 'admin';
    
    // Update plan badge
    const planBadge = document.querySelector('#user-plan-badge .plan-badge');
    if (planBadge) {
      if (isPremium) {
        planBadge.textContent = 'Premium';
        planBadge.classList.remove('free');
        planBadge.classList.add('premium');
      } else {
        planBadge.textContent = 'Free Plan';
        planBadge.classList.remove('premium');
        planBadge.classList.add('free');
      }
    }

    // Show/hide premium banner (top of content area)
    const premiumBanner = document.getElementById('premium-banner');
    if (premiumBanner) {
      // Check if banner was dismissed
      chrome.storage.local.get(['premiumBannerDismissed'], (result) => {
        if (!isPremium && !result.premiumBannerDismissed) {
          premiumBanner.classList.remove('hidden');
        } else {
          premiumBanner.classList.add('hidden');
        }
      });
    }

    // Show/hide premium upgrade card (in account tab)
    const premiumCard = document.getElementById('premium-upgrade-card');
    if (premiumCard) {
      if (isPremium) {
        premiumCard.classList.add('hidden');
      } else {
        premiumCard.classList.remove('hidden');
      }
    }
  }

  private dismissPremiumBanner(): void {
    const premiumBanner = document.getElementById('premium-banner');
    if (premiumBanner) {
      premiumBanner.classList.add('hidden');
      // Remember dismissal for this session
      chrome.storage.local.set({ premiumBannerDismissed: true });
    }
  }

  private openUpgradePage(): void {
    const upgradeUrl = sanitizeBaseUrl(DEFAULT_WEB_APP_URL) + '/upgrade';
    chrome.tabs.create({ url: upgradeUrl });
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
