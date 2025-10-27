import { authManager } from "../components/Auth/AuthManager";
import { jobManager } from "../components/Jobs/JobManager";
import { settingsManager } from "../components/Settings/SettingsManager";
import { popupUI } from "../components/UI/PopupUI";
import { sanitizeBaseUrl, DEFAULT_WEB_APP_URL } from "../constants";

export class PopupController {
  private static instance: PopupController;
  private isInitialized = false;
  
  private constructor() {}
  
  public static getInstance(): PopupController {
    if (!PopupController.instance) {
      PopupController.instance = new PopupController();
    }
    return PopupController.instance;
  }
  
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize settings first
      await settingsManager.loadSettings();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Try to sync auth state from web app
      await authManager.attemptSyncFromWebApp();
      
      // Load initial data if authenticated
      if (authManager.isAuthenticated()) {
        await this.loadInitialData();
      }
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Error initializing popup controller:', error);
      popupUI.showError('Failed to initialize popup');
    }
  }
  
  private setupEventListeners(): void {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
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
    document.querySelectorAll('.filter-btn').forEach(filter => {
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
  }
  
  private setupAuthEventListeners(): void {
    // Sign in form
    const signInBtn = document.getElementById('sign-in-btn');
    if (signInBtn) {
      signInBtn.addEventListener('click', async () => {
        const email = popupUI.getElementValue('email-input');
        const password = popupUI.getElementValue('password-input');
        
        if (!email || !password) {
          popupUI.showError('Please enter both email and password');
          return;
        }
        
        await authManager.signIn(email, password);
      });
    }
    
    // Sign up form
    const signUpBtn = document.getElementById('sign-up-btn');
    if (signUpBtn) {
      signUpBtn.addEventListener('click', async () => {
        const email = popupUI.getElementValue('email-input');
        const password = popupUI.getElementValue('password-input');
        
        if (!email || !password) {
          popupUI.showError('Please enter both email and password');
          return;
        }
        
        if (password.length < 6) {
          popupUI.showError('Password must be at least 6 characters long');
          return;
        }
        
        await authManager.signUp(email, password);
      });
    }
    
    // Google sign in
    const googleSignInBtn = document.getElementById('google-sign-in-btn');
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
    
    // Form submissions
    const emailForm = document.getElementById('email-form');
    if (emailForm) {
      emailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        signInBtn?.click();
      });
    }
    
    // Clear auth messages when typing
    ['email-input', 'password-input'].forEach(inputId => {
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
    try {
      // Load stats
      await this.loadStats();
      
      // Load jobs
      await jobManager.loadJobs();
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }
  
  private async loadStats(): Promise<void> {
    try {
      const stats = await jobManager.getJobs();
      const today = new Date().toDateString();
      
      const jobsToday = stats.filter(job => 
        job.postedDate && new Date(job.postedDate).toDateString() === today
      ).length;
      
      const sponsoredJobs = jobManager.getSponsoredJobsCount();
      const appliedCount = jobManager.getAppliedJobsCount();
      
      popupUI.setElementText('jobs-today', jobsToday.toString());
      popupUI.setElementText('sponsored-jobs', sponsoredJobs.toString());
      popupUI.setElementText('applications', appliedCount.toString());
      popupUI.setElementText('applied-count', appliedCount.toString());
      
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
