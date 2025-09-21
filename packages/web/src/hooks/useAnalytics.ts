// React hooks for Firebase Analytics
import { useEffect, useCallback, useRef } from 'react';
import { analytics, analyticsService, setAnalyticsUserId, clearAnalyticsUserId, setAnalyticsUserProperties, type UserProperties } from '@/firebase/analytics';
import { useFirebaseAuth } from '@/providers/firebase-auth-provider';

// Hook for basic analytics tracking
export function useAnalytics() {
  const { user } = useFirebaseAuth();

  // Track user identification
  useEffect(() => {
    if (user) {
      setAnalyticsUserId(user.uid);
    } else {
      clearAnalyticsUserId();
    }
  }, [user]);

  // Page view tracking
  const trackPageView = useCallback((pageName: string, pageTitle?: string) => {
    analytics.logPageView(pageName, pageTitle);
  }, []);

  // Feature usage tracking
  const trackFeatureUse = useCallback((featureName: string, context?: string) => {
    analytics.logFeatureUsed(featureName, context);
  }, []);

  // Error tracking
  const trackError = useCallback((errorType: string, errorMessage: string, context?: Record<string, any>) => {
    analytics.logError(errorType, errorMessage, context);
  }, []);

  return {
    trackPageView,
    trackFeatureUse,
    trackError,
  };
}

// Hook for user properties management
export function useAnalyticsUserProperties() {
  const setUserProperties = useCallback((properties: UserProperties) => {
    setAnalyticsUserProperties(properties);
  }, []);

  return { setUserProperties };
}

// Hook for time spent tracking on a page/component
export function useTimeTracking(pageName: string) {
  const startTimeRef = useRef<number>(Date.now());
  const isActiveRef = useRef<boolean>(true);

  useEffect(() => {
    startTimeRef.current = Date.now();
    isActiveRef.current = true;

    return () => {
      isActiveRef.current = false;
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (timeSpent > 0) {
        analytics.logTimeSpent(pageName, timeSpent);
      }
    };
  }, [pageName]);

  const trackTimeSpent = useCallback(() => {
    if (isActiveRef.current) {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (timeSpent > 0) {
        analytics.logTimeSpent(pageName, timeSpent);
      }
      startTimeRef.current = Date.now();
    }
  }, [pageName]);

  return { trackTimeSpent };
}

// Hook for tracking form interactions
export function useFormAnalytics(formName: string) {
  const trackFormStart = useCallback(() => {
    analytics.logFeatureUsed(`form_start_${formName}`);
  }, [formName]);

  const trackFormSubmit = useCallback((success: boolean, errorMessage?: string) => {
    analyticsService.logEvent({
      name: `form_submit_${formName}`,
      parameters: {
        success,
        error_message: errorMessage,
      },
    });
  }, [formName]);

  const trackFormFieldInteraction = useCallback((fieldName: string, action: 'focus' | 'blur' | 'change') => {
    analyticsService.logEvent({
      name: `form_field_${action}`,
      parameters: {
        form_name: formName,
        field_name: fieldName,
        action,
      },
    });
  }, [formName]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormFieldInteraction,
  };
}

// Hook for tracking job-related analytics
export function useJobAnalytics() {
  const trackJobView = useCallback((jobId: string, jobTitle: string, source: string) => {
    analytics.logJobViewed(jobId, jobTitle, source);
  }, []);

  const trackJobApply = useCallback((jobId: string, applicationId: string, jobTitle: string) => {
    analytics.logJobApplied(jobId, applicationId, jobTitle);
  }, []);

  const trackJobSearch = useCallback((query: string, location?: string, resultsCount?: number) => {
    analytics.logJobSearch(query, location, resultsCount);
  }, []);

  return {
    trackJobView,
    trackJobApply,
    trackJobSearch,
  };
}

// Hook for tracking CV/resume analytics
export function useCvAnalytics() {
  const trackCvUpload = useCallback((cvId: string, fileSize: number, fileType: string) => {
    analytics.logCvUploaded(cvId, fileSize, fileType);
  }, []);

  const trackCvAnalysis = useCallback((cvId: string, analysisType: string, success: boolean) => {
    analytics.logCvAnalyzed(cvId, analysisType, success);
  }, []);

  return {
    trackCvUpload,
    trackCvAnalysis,
  };
}

// Hook for tracking application analytics
export function useApplicationAnalytics() {
  const trackApplicationCreate = useCallback((applicationId: string, jobId: string, status: string) => {
    analytics.logApplicationCreated(applicationId, jobId, status);
  }, []);

  const trackApplicationStatusChange = useCallback((applicationId: string, oldStatus: string, newStatus: string) => {
    analytics.logApplicationStatusChanged(applicationId, oldStatus, newStatus);
  }, []);

  return {
    trackApplicationCreate,
    trackApplicationStatusChange,
  };
}

// Hook for tracking dashboard analytics
export function useDashboardAnalytics() {
  const trackDashboardView = useCallback((tab?: string) => {
    analytics.logDashboardViewed(tab);
  }, []);

  return {
    trackDashboardView,
  };
}
