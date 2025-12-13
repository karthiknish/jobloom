// React hooks for Firebase Remote Config
import { useState, useEffect, useCallback } from 'react';
import {
  remoteConfig as rc,
  remoteConfigService,
  subscribeToRemoteConfig,
  refreshRemoteConfig,
} from '@/firebase/remoteConfig';
import { safeLocalStorageGet } from '@/utils/safeBrowserStorage';

// Hook for accessing remote config values
export function useRemoteConfig() {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    const unsubscribe = subscribeToRemoteConfig((newConfig) => {
      setConfig(newConfig);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await refreshRemoteConfig();
    } catch (error) {
      console.error('Failed to refresh remote config:', error);
      setIsLoading(false);
    }
  }, []);

  return {
    config,
    isLoading,
    refresh,
    // Convenience getters
    ...rc,
  };
}

// Hook for feature flag checking
export function useFeatureFlag(featureName: string): boolean {
  const [isEnabled, setIsEnabled] = useState(remoteConfigService.isFeatureEnabled(featureName));

  useEffect(() => {
    const unsubscribe = subscribeToRemoteConfig(() => {
      setIsEnabled(remoteConfigService.isFeatureEnabled(featureName));
    });

    return unsubscribe;
  }, [featureName]);

  return isEnabled;
}

// Hook for configuration value with type safety
export function useConfigValue<T>(key: string, defaultValue: T): T {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    const unsubscribe = subscribeToRemoteConfig(() => {
      // Get the value from remote config, fallback to default
      const config = rc as any;
      const newValue = config[key] !== undefined ? config[key] : defaultValue;
      setValue(newValue as T);
    });

    return unsubscribe;
  }, [key, defaultValue]);

  return value;
}

// Hook for multiple feature flags
export function useFeatureFlags(featureNames: string[]): Record<string, boolean> {
  const [flags, setFlags] = useState<Record<string, boolean>>(() =>
    featureNames.reduce((acc, name) => ({
      ...acc,
      [name]: remoteConfigService.isFeatureEnabled(name),
    }), {})
  );

  useEffect(() => {
    const unsubscribe = subscribeToRemoteConfig(() => {
      const newFlags = featureNames.reduce((acc, name) => ({
        ...acc,
        [name]: remoteConfigService.isFeatureEnabled(name),
      }), {});
      setFlags(newFlags);
    });

    return unsubscribe;
  }, [featureNames]);

  return flags;
}

// Hook for maintenance mode
export function useMaintenanceMode() {
  const isEnabled = useFeatureFlag('maintenance_mode_enabled');
  const message = useConfigValue('maintenance_message', 'The service is currently under maintenance. Please try again later.');

  return {
    isMaintenanceMode: isEnabled,
    maintenanceMessage: message,
  };
}

// Hook for rate limiting configuration
export function useRateLimits() {
  const jobsPerHour = useConfigValue('rate_limit_jobs_per_hour', 100);
  const applicationsPerHour = useConfigValue('rate_limit_applications_per_hour', 50);
  const cvAnalysesPerHour = useConfigValue('rate_limit_cv_analyses_per_hour', 20);

  return {
    jobsPerHour,
    applicationsPerHour,
    cvAnalysesPerHour,
  };
}

// Hook for UI configuration
export function useUIConfig() {
  const refreshInterval = useConfigValue('dashboard_refresh_interval_seconds', 300);
  const notificationDuration = useConfigValue('notification_display_duration_seconds', 5);
  const toastDelay = useConfigValue('toast_auto_hide_delay_seconds', 3);

  return {
    dashboardRefreshInterval: refreshInterval * 1000, // Convert to milliseconds
    notificationDisplayDuration: notificationDuration * 1000,
    toastAutoHideDelay: toastDelay * 1000,
  };
}

// Hook for file upload limits
export function useFileUploadLimits() {
  const maxCvSize = useConfigValue('max_cv_file_size_mb', 10);
  const maxProfileSize = useConfigValue('max_profile_picture_size_mb', 5);

  return {
    maxCvFileSize: maxCvSize * 1024 * 1024, // Convert to bytes
    maxProfilePictureSize: maxProfileSize * 1024 * 1024,
  };
}

// Hook for conditional rendering based on feature flags
export function useConditionalRender(featureName: string) {
  const isEnabled = useFeatureFlag(featureName);

  return {
    isEnabled,
  };
}

// Hook for A/B testing or feature rollout
export function useFeatureRollout(featureName: string, rolloutPercentage: number = 100) {
  const isEnabled = useFeatureFlag(featureName);
  const [isUserInRollout, setIsUserInRollout] = useState(false);

  useEffect(() => {
    if (isEnabled && rolloutPercentage < 100) {
      // Simple rollout logic based on user ID hash
      // In a real implementation, you'd use a more sophisticated approach
      const userId = safeLocalStorageGet('userId') || 'anonymous';
      const hash = userId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const percentage = Math.abs(hash) % 100;
      setIsUserInRollout(percentage < rolloutPercentage);
    } else {
      setIsUserInRollout(isEnabled);
    }
  }, [isEnabled, rolloutPercentage]);

  return isUserInRollout;
}
