"use client";

import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from "react";
import { analyticsService, UserProperties, ANALYTICS_EVENTS } from "@/firebase/analytics";
import { ensureFirebaseApp } from "@/firebase/client";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { User } from "firebase/auth";
import { usePathname } from "next/navigation";

// Types for analytics context
interface AnalyticsContextType {
  user: User | null;
  userProperties: UserProperties | null;
  isInitialized: boolean;
  pageStartTime: number;
  currentPage: string;
  sessionStartTime: number;
  eventQueue: Array<{
    name: string;
    parameters?: Record<string, any>;
    timestamp: number;
  }>;
}

interface AnalyticsProviderProps {
  children: React.ReactNode;
  trackPageViews?: boolean;
  trackSessionDuration?: boolean;
  trackUserProperties?: boolean;
  trackEngagement?: boolean;
  autoPageViewTracking?: boolean;
  enableDebugMode?: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({
  children,
  trackPageViews = true,
  trackSessionDuration = true,
  trackUserProperties = true,
  trackEngagement = true,
  autoPageViewTracking = true,
  enableDebugMode = false,
}: AnalyticsProviderProps) {
  const { user } = useFirebaseAuth();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);
  const [userProperties, setUserProperties] = useState<UserProperties | null>(null);
  const [eventQueue, setEventQueue] = useState<Array<{
    name: string;
    parameters?: Record<string, any>;
    timestamp: number;
  }>>([]);

  const pageStartTimeRef = useRef<number>(Date.now());
  const sessionStartTimeRef = useRef<number>(Date.now());
  const currentPageRef = useRef<string>('');

  // Initialize analytics and Firebase
  useEffect(() => {
    const initAnalytics = async () => {
      try {
        await ensureFirebaseApp();
        await analyticsService.initialize();
        setIsInitialized(true);
      } catch (error) {
        // Intentionally no console logging here.
      }
    };

    initAnalytics();
  }, [enableDebugMode]);

  // Track page views on route changes
  useEffect(() => {
    if (!isInitialized || !autoPageViewTracking) return;

    const pageName = pathname || 'unknown';
    const pageTitle = document.title || pageName;

    // Track previous page time spent
    if (currentPageRef.current) {
      const timeSpent = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      analyticsService.logTimeSpent(currentPageRef.current, timeSpent);
    }

    // Track new page view
    analyticsService.logPageView(pageName, pageTitle);
    
    // Track page load time
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
      analyticsService.logPageLoadTime(pageName, loadTime);
    }

    currentPageRef.current = pageName;
    pageStartTimeRef.current = Date.now();
  }, [pathname, isInitialized, autoPageViewTracking, enableDebugMode]);

  // Update user properties when user changes
  useEffect(() => {
    if (!isInitialized || !trackUserProperties) return;

    if (user) {
      analyticsService.setUserId(user.uid);
      
      const properties: UserProperties = {
        user_type: 'free', // This should be updated based on subscription status
        last_login_date: new Date().toISOString(),
      };

      analyticsService.setUserProperties(properties);
      setUserProperties(properties);
    } else {
      analyticsService.clearUserId();
      setUserProperties(null);
    }
  }, [user, isInitialized, trackUserProperties, enableDebugMode]);

  // Session tracking
  useEffect(() => {
    if (!isInitialized || !trackSessionDuration) return;

    const handleSessionStart = () => {
      sessionStartTimeRef.current = Date.now();
      analyticsService.logSessionDuration(0);
      analyticsService.logUserEngagement('session_start', JSON.stringify({
        user_id: user?.uid,
      }));
    };

    const handleSessionEnd = () => {
      const sessionDuration = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000 / 60); // in minutes
      analyticsService.logSessionDuration(sessionDuration);
      analyticsService.logUserEngagement('session_end', JSON.stringify({
        user_id: user?.uid,
        session_duration_minutes: sessionDuration,
      }));

      // Track previous page time spent
      if (currentPageRef.current) {
        const timeSpent = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
        analyticsService.logTimeSpent(currentPageRef.current, timeSpent);
      }
    };

    // Start session
    handleSessionStart();

    // Set up session timeout (30 minutes)
    const timeoutId = setTimeout(() => {
      handleSessionEnd();
      handleSessionStart(); // Start new session
    }, 30 * 60 * 1000);

    // Track page unload
    const handleUnload = () => {
      handleSessionEnd();
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('beforeunload', handleUnload);
      handleSessionEnd();
    };
  }, [isInitialized, trackSessionDuration, user]);

  const contextValue: AnalyticsContextType = {
    user,
    userProperties,
    isInitialized,
    pageStartTime: pageStartTimeRef.current,
    currentPage: currentPageRef.current,
    sessionStartTime: sessionStartTimeRef.current,
    eventQueue,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Hook for user analytics
export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }

  const trackEvent = useCallback((name: string, parameters?: Record<string, any>) => {
    if (analyticsService.isReady) {
      analyticsService.logEvent({ name, parameters });
    }
  }, []);

  const trackPageView = useCallback((pageName: string, pageTitle?: string) => {
    if (analyticsService.isReady) {
      analyticsService.logPageView(pageName, pageTitle);
    }
  }, []);

  const trackUserEngagement = useCallback((action: string, context?: string) => {
    if (analyticsService.isReady) {
      analyticsService.logUserEngagement(action, context);
    }
  }, []);

  const trackUserPropertiesUpdate = useCallback((properties: Partial<UserProperties>) => {
    if (analyticsService.isReady && context.user) {
      analyticsService.setUserProperties({
        ...context.userProperties,
        ...properties,
        last_login_date: new Date().toISOString(),
      });
    }
  }, [context.user, context.userProperties]);

  return {
    ...context,
    
    // User tracking
    trackEvent,
    trackPageView,
    trackUserEngagement,
    trackUserPropertiesUpdate,
    
    // Analytics service
    analyticsService,
    
    // Status
    isAnalyticsReady: analyticsService.isReady,
  };
}

// Enhanced analytics hooks for specific features
export function usePageAnalytics(pageName: string, pageTitle?: string, dependencies: any[] = []) {
  const { trackPageView } = useAnalytics();
  
  useEffect(() => {
    trackPageView(pageName, pageTitle);
  }, [trackPageView, pageName, pageTitle, ...dependencies]);
}

export function useJobAnalytics() {
  const { trackEvent } = useAnalytics();
  
  const trackJobView = useCallback((jobId: string, jobTitle: string, source = 'web') => {
    trackEvent(ANALYTICS_EVENTS.JOB_VIEWED, {
      job_id: jobId,
      job_title: jobTitle,
      source,
    });
  }, [trackEvent]);
  
  const trackJobApplied = useCallback((jobId: string, applicationId: string, jobTitle: string) => {
    trackEvent(ANALYTICS_EVENTS.JOB_APPLIED, {
      job_id: jobId,
      application_id: applicationId,
      job_title: jobTitle,
    });
  }, [trackEvent]);
  
  const trackJobSaved = useCallback((jobId: string, jobTitle: string) => {
    trackEvent(ANALYTICS_EVENTS.JOB_SAVED, {
      job_id: jobId,
      job_title: jobTitle,
    });
  }, [trackEvent]);
  
  const trackJobSearch = useCallback((query: string, location?: string, resultsCount?: number) => {
    trackEvent(ANALYTICS_EVENTS.JOB_SEARCHED, {
      search_query: query,
      location,
      results_count: resultsCount,
    });
  }, [trackEvent]);
  
  const trackJobFilter = useCallback((filterType: string, filterValue: string) => {
    trackEvent(ANALYTICS_EVENTS.JOB_FILTER_APPLIED, {
      filter_type: filterType,
      filter_value: filterValue,
    });
  }, [trackEvent]);
  
  const trackJobShare = useCallback((jobId: string, shareMethod: string, jobTitle: string) => {
    trackEvent(ANALYTICS_EVENTS.JOB_SHARED, {
      job_id: jobId,
      share_method: shareMethod,
      job_title: jobTitle,
    });
  }, [trackEvent]);

  return {
    trackJobView,
    trackJobApplied,
    trackJobSaved,
    trackJobSearch,
    trackJobFilter,
    trackJobShare,
  };
}

export function useCvAnalytics() {
  const { trackEvent } = useAnalytics();
  
  const trackCvUploaded = useCallback((cvId: string, fileSize: number, fileType: string) => {
    trackEvent(ANALYTICS_EVENTS.CV_UPLOADED, {
      cv_id: cvId,
      file_size: fileSize,
      file_type: fileType,
    });
  }, [trackEvent]);
  
  const trackCvAnalyzed = useCallback((cvId: string, analysisType: string, success: boolean) => {
    trackEvent(ANALYTICS_EVENTS.CV_ANALYZED, {
      cv_id: cvId,
      analysis_type: analysisType,
      success,
    });
  }, [trackEvent]);

  return {
    trackCvUploaded,
    trackCvAnalyzed,
  };
}

export function useDashboardAnalytics() {
  const { trackEvent } = useAnalytics();
  
  const trackDashboardView = useCallback((tab?: string) => {
    trackEvent(ANALYTICS_EVENTS.DASHBOARD_VIEWED, { tab });
  }, [trackEvent]);

  return {
    trackDashboardView,
  };
}


export function useExtensionAnalytics() {
  const { trackEvent } = useAnalytics();
  
  const trackExtensionPopupOpened = useCallback(() => {
    trackEvent(ANALYTICS_EVENTS.EXTENSION_POPUP_OPENED);
  }, [trackEvent]);

  return {
    trackExtensionPopupOpened,
  };
}
