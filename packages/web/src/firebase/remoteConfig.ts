// Firebase Remote Config for feature flags and dynamic configuration
import {
  fetchAndActivate,
  getAll,
  type RemoteConfig,
  type Value,
} from "firebase/remote-config";
import { getRemoteConfigClient } from "./client";

// Remote Config service class
class FirebaseRemoteConfigService {
  private remoteConfig: RemoteConfig | null = null;
  private isInitialized = false;
  private configValues = new Map<string, any>();
  private listeners = new Set<(config: Map<string, any>) => void>();
  private hasLoggedUnavailable = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const remoteConfig = getRemoteConfigClient();
      if (remoteConfig) {
        this.remoteConfig = remoteConfig;

        // Configure fetch settings
        this.remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
        this.remoteConfig.settings.fetchTimeoutMillis = 60000; // 60 seconds

        // Set default values
        this.setDefaultValues();

        // Fetch and activate remote config
        await this.fetchAndActivate();

        this.isInitialized = true;
        console.log('Firebase Remote Config initialized');
      } else {
        if (!this.hasLoggedUnavailable && process.env.NODE_ENV === 'development') {
          console.info('Firebase Remote Config not available; using defaults');
        }
        this.hasLoggedUnavailable = true;
        // Use default values when Remote Config is not available
        this.setDefaultValues();
        this.isInitialized = true;
      }
    } catch (error) {
      console.warn('Failed to initialize Firebase Remote Config:', error);
      // Use default values as fallback
      this.setDefaultValues();
      this.isInitialized = true;
    }
  }

  private setDefaultValues(): void {
    const defaults = {
      // Feature flags
      'feature_job_import': true,
      'feature_cv_analysis': true,
      'feature_advanced_filters': true,
      'feature_bulk_actions': true,
      'feature_real_time_updates': true,
      'feature_analytics_tracking': true,
      'feature_performance_monitoring': true,
      'feature_notifications': true,
      'feature_beta_features': false,

      // Configuration values
      'max_jobs_per_import': 50,
      'max_cv_file_size_mb': 10,
      'max_profile_picture_size_mb': 5,
      'session_timeout_hours': 24,
      'cache_expiry_hours': 1,
      'retry_attempts': 3,
      'api_timeout_seconds': 30,

      // UI/UX settings
      'dashboard_refresh_interval_seconds': 300,
      'notification_display_duration_seconds': 5,
      'toast_auto_hide_delay_seconds': 3,

      // Rate limiting
      'rate_limit_jobs_per_hour': 100,
      'rate_limit_applications_per_hour': 50,
      'rate_limit_cv_analyses_per_hour': 20,

      // Maintenance mode
      'maintenance_mode_enabled': false,
      'maintenance_message': 'The service is currently under maintenance. Please try again later.',
    };

    // Set default values in the config map
    Object.entries(defaults).forEach(([key, value]) => {
      this.configValues.set(key, value);
    });
  }

  async fetchAndActivate(): Promise<void> {
    if (!this.remoteConfig) return;

    try {
      const activated = await fetchAndActivate(this.remoteConfig);
      console.log('Remote config fetched and activated:', activated);

      // Update local cache with remote values
      this.updateLocalCache();

      // Notify listeners
      this.notifyListeners();
    } catch (error) {
      console.warn('Failed to fetch and activate remote config:', error);
    }
  }

  private updateLocalCache(): void {
    if (!this.remoteConfig) return;

    const allValues = getAll(this.remoteConfig);
    Object.entries(allValues).forEach(([key, value]) => {
      const parsedValue = this.parseRemoteValue(value);
      this.configValues.set(key, parsedValue);
    });
  }

  private parseRemoteValue(value: Value): any {
    const stringValue = value.asString();

    // Try to parse as JSON first
    try {
      return JSON.parse(stringValue);
    } catch {
      // Not JSON, return as string
    }

    // Try to parse as number
    const numberValue = value.asNumber();
    if (!isNaN(numberValue) && stringValue !== '') {
      return numberValue;
    }

    // Try to parse as boolean
    if (stringValue === 'true') return true;
    if (stringValue === 'false') return false;

    // Return as string
    return stringValue;
  }

  // Get configuration value
  getValue<T = any>(key: string, defaultValue?: T): T {
    const value = this.configValues.get(key);
    return (value !== undefined ? value : defaultValue) as T;
  }

  // Get all configuration values
  getAllValues(): Map<string, any> {
    return new Map(this.configValues);
  }

  // Check if feature is enabled
  isFeatureEnabled(featureName: string): boolean {
    return this.getValue(`feature_${featureName}`, false);
  }

  // Subscribe to configuration changes
  subscribe(callback: (config: Map<string, any>) => void): () => void {
    this.listeners.add(callback);

    // Immediately call with current values
    callback(this.getAllValues());

    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const currentConfig = this.getAllValues();
    this.listeners.forEach(callback => {
      try {
        callback(currentConfig);
      } catch (error) {
        console.warn('Error in remote config listener:', error);
      }
    });
  }

  // Force refresh configuration
  async refresh(): Promise<void> {
    await this.fetchAndActivate();
  }

  // Get configuration metadata
  getConfigInfo(): {
    isInitialized: boolean;
    lastFetchTime?: number;
    fetchTimeoutMillis?: number;
    minimumFetchIntervalMillis?: number;
  } {
    return {
      isInitialized: this.isInitialized,
      lastFetchTime: this.remoteConfig?.settings.minimumFetchIntervalMillis ? Date.now() : undefined,
      fetchTimeoutMillis: this.remoteConfig?.settings.fetchTimeoutMillis,
      minimumFetchIntervalMillis: this.remoteConfig?.settings.minimumFetchIntervalMillis,
    };
  }
}

// Create singleton instance
const remoteConfigService = new FirebaseRemoteConfigService();

// Initialize remote config when the module loads
if (typeof window !== 'undefined') {
  remoteConfigService.initialize();
}

// Export service and convenience functions
export { remoteConfigService };

// Convenience functions for direct use
export const getRemoteConfigValue = <T = any>(key: string, defaultValue?: T): T =>
  remoteConfigService.getValue(key, defaultValue);

export const getAllRemoteConfigValues = () => remoteConfigService.getAllValues();

export const isFeatureEnabled = (featureName: string): boolean =>
  remoteConfigService.isFeatureEnabled(featureName);

export const subscribeToRemoteConfig = (callback: (config: Map<string, any>) => void): (() => void) =>
  remoteConfigService.subscribe(callback);

export const refreshRemoteConfig = () => remoteConfigService.refresh();

export const getRemoteConfigInfo = () => remoteConfigService.getConfigInfo();

// Predefined feature flag getters
export const remoteConfig = {
  // Feature flags
  get isJobImportEnabled(): boolean {
    return isFeatureEnabled('job_import');
  },

  get isCvAnalysisEnabled(): boolean {
    return isFeatureEnabled('cv_analysis');
  },

  get isAdvancedFiltersEnabled(): boolean {
    return isFeatureEnabled('advanced_filters');
  },

  get isBulkActionsEnabled(): boolean {
    return isFeatureEnabled('bulk_actions');
  },

  get isRealTimeUpdatesEnabled(): boolean {
    return isFeatureEnabled('real_time_updates');
  },

  get isAnalyticsEnabled(): boolean {
    return remoteConfigService.getValue('feature_analytics_tracking', true);
  },

  get isPerformanceMonitoringEnabled(): boolean {
    return isFeatureEnabled('performance_monitoring');
  },

  get isNotificationsEnabled(): boolean {
    return isFeatureEnabled('notifications');
  },

  get isBetaFeaturesEnabled(): boolean {
    return isFeatureEnabled('beta_features');
  },

  get isMaintenanceModeEnabled(): boolean {
    return isFeatureEnabled('maintenance_mode_enabled');
  },

  // Configuration values
  get maxJobsPerImport(): number {
    return getRemoteConfigValue('max_jobs_per_import', 50);
  },

  get maxCvFileSizeMb(): number {
    return getRemoteConfigValue('max_cv_file_size_mb', 10);
  },

  get maxProfilePictureSizeMb(): number {
    return getRemoteConfigValue('max_profile_picture_size_mb', 5);
  },

  get sessionTimeoutHours(): number {
    return getRemoteConfigValue('session_timeout_hours', 24);
  },

  get cacheExpiryHours(): number {
    return getRemoteConfigValue('cache_expiry_hours', 1);
  },

  get retryAttempts(): number {
    return getRemoteConfigValue('retry_attempts', 3);
  },

  get apiTimeoutSeconds(): number {
    return getRemoteConfigValue('api_timeout_seconds', 30);
  },

  get dashboardRefreshIntervalSeconds(): number {
    return getRemoteConfigValue('dashboard_refresh_interval_seconds', 300);
  },

  get notificationDisplayDurationSeconds(): number {
    return getRemoteConfigValue('notification_display_duration_seconds', 5);
  },

  get toastAutoHideDelaySeconds(): number {
    return getRemoteConfigValue('toast_auto_hide_delay_seconds', 3);
  },

  get maintenanceMessage(): string {
    return getRemoteConfigValue('maintenance_message', 'The service is currently under maintenance. Please try again later.');
  },

  // Rate limiting
  get rateLimitJobsPerHour(): number {
    return getRemoteConfigValue('rate_limit_jobs_per_hour', 100);
  },

  get rateLimitApplicationsPerHour(): number {
    return getRemoteConfigValue('rate_limit_applications_per_hour', 50);
  },

  get rateLimitCvAnalysesPerHour(): number {
    return getRemoteConfigValue('rate_limit_cv_analyses_per_hour', 20);
  },
};
