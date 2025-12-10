"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAnalytics } from "@/providers/analytics-provider";
import { ANALYTICS_EVENTS } from "@/firebase/analytics-events";
import { 
  CONVERSION_FUNNELS, 
  calculateEngagementScore,
  getFunnelStep,
} from "@/firebase/analytics-funnels";

/**
 * Hook for tracking conversion funnel progression
 */
export function useConversionTracking() {
  const { trackEvent, isInitialized } = useAnalytics();
  const trackedSteps = useRef<Set<string>>(new Set());

  // Track a specific funnel step
  const trackFunnelStep = useCallback((
    funnelName: string,
    stepId: string,
    additionalParams?: Record<string, any>
  ) => {
    if (!isInitialized) return;
    
    const stepKey = `${funnelName}:${stepId}`;
    if (trackedSteps.current.has(stepKey)) return;
    
    trackedSteps.current.add(stepKey);
    
    trackEvent("funnel_step_completed", {
      funnel_name: funnelName,
      step_id: stepId,
      ...additionalParams,
    });
  }, [trackEvent, isInitialized]);

  // Track signup to premium funnel
  const trackSignupFunnel = useCallback((step: 'landing' | 'signup_started' | 'account_created' | 'first_job' | 'cv_uploaded' | 'upgrade_viewed' | 'upgraded') => {
    const stepMap: Record<string, string> = {
      landing: 'landing_page',
      signup_started: 'signup_started',
      account_created: 'account_created',
      first_job: 'first_job_added',
      cv_uploaded: 'cv_uploaded',
      upgrade_viewed: 'upgrade_viewed',
      upgraded: 'subscription_upgraded',
    };
    trackFunnelStep(CONVERSION_FUNNELS.SIGNUP_TO_PREMIUM.name, stepMap[step]);
  }, [trackFunnelStep]);

  // Track job application funnel
  const trackApplicationFunnel = useCallback((step: 'viewed' | 'saved' | 'created' | 'applied' | 'interviewing' | 'offered', jobId?: string) => {
    const stepMap: Record<string, string> = {
      viewed: 'job_viewed',
      saved: 'job_saved',
      created: 'application_created',
      applied: 'status_applied',
      interviewing: 'status_interviewing',
      offered: 'status_offered',
    };
    trackFunnelStep(CONVERSION_FUNNELS.JOB_APPLICATION.name, stepMap[step], { job_id: jobId });
  }, [trackFunnelStep]);

  // Track CV evaluation funnel
  const trackCVFunnel = useCallback((step: 'page_viewed' | 'uploaded' | 'analyzed' | 'downloaded') => {
    const stepMap: Record<string, string> = {
      page_viewed: 'cv_page_viewed',
      uploaded: 'cv_uploaded',
      analyzed: 'cv_analyzed',
      downloaded: 'cv_downloaded',
    };
    trackFunnelStep(CONVERSION_FUNNELS.CV_EVALUATION.name, stepMap[step]);
  }, [trackFunnelStep]);

  // Track activation funnel
  const trackActivation = useCallback((step: 'signup' | 'profile' | 'first_job' | 'cv_uploaded' | 'extension' | 'applied') => {
    const stepMap: Record<string, string> = {
      signup: 'account_created',
      profile: 'profile_completed',
      first_job: 'first_job_added',
      cv_uploaded: 'cv_uploaded',
      extension: 'extension_connected',
      applied: 'applied_to_job',
    };
    trackFunnelStep(CONVERSION_FUNNELS.ACTIVATION.name, stepMap[step]);
  }, [trackFunnelStep]);

  return {
    trackFunnelStep,
    trackSignupFunnel,
    trackApplicationFunnel,
    trackCVFunnel,
    trackActivation,
  };
}

/**
 * Hook for tracking user behavior and engagement
 */
export function useBehaviorTracking() {
  const { trackEvent, isInitialized } = useAnalytics();
  const sessionStart = useRef(Date.now());
  const pagesViewed = useRef<string[]>([]);
  const actionsCount = useRef(0);

  // Track user action
  const trackAction = useCallback((actionType: string, context?: Record<string, any>) => {
    if (!isInitialized) return;
    
    actionsCount.current++;
    
    trackEvent("user_action", {
      action_type: actionType,
      session_duration_ms: Date.now() - sessionStart.current,
      actions_count: actionsCount.current,
      ...context,
    });
  }, [trackEvent, isInitialized]);

  // Track feature discovery
  const trackFeatureDiscovery = useCallback((featureName: string, method: 'organic' | 'guided' | 'search' | 'notification') => {
    if (!isInitialized) return;
    
    trackEvent("feature_discovered", {
      feature_name: featureName,
      discovery_method: method,
    });
  }, [trackEvent, isInitialized]);

  // Track user frustration signals
  const trackFrustration = useCallback((type: 'rage_click' | 'error_repeated' | 'form_abandoned' | 'back_navigation', context?: Record<string, any>) => {
    if (!isInitialized) return;
    
    trackEvent("frustration_signal", {
      frustration_type: type,
      ...context,
    });
  }, [trackEvent, isInitialized]);

  // Track intent signals
  const trackIntent = useCallback((intentType: 'upgrade_interest' | 'export_data' | 'delete_account' | 'feature_request', context?: Record<string, any>) => {
    if (!isInitialized) return;
    
    trackEvent("user_intent", {
      intent_type: intentType,
      ...context,
    });
  }, [trackEvent, isInitialized]);

  // Track form analytics
  const trackFormInteraction = useCallback((formId: string, action: 'started' | 'field_focused' | 'field_completed' | 'submitted' | 'abandoned', fieldName?: string) => {
    if (!isInitialized) return;
    
    trackEvent("form_interaction", {
      form_id: formId,
      action,
      field_name: fieldName,
    });
  }, [trackEvent, isInitialized]);

  // Track scroll depth
  const trackScrollDepth = useCallback((pageName: string, depth: 25 | 50 | 75 | 100) => {
    if (!isInitialized) return;
    
    trackEvent("scroll_depth", {
      page_name: pageName,
      depth_percentage: depth,
    });
  }, [trackEvent, isInitialized]);

  // Get engagement metrics
  const getSessionMetrics = useCallback(() => ({
    sessionDurationMs: Date.now() - sessionStart.current,
    pagesViewed: pagesViewed.current.length,
    uniquePagesViewed: new Set(pagesViewed.current).size,
    actionsCount: actionsCount.current,
  }), []);

  return {
    trackAction,
    trackFeatureDiscovery,
    trackFrustration,
    trackIntent,
    trackFormInteraction,
    trackScrollDepth,
    getSessionMetrics,
  };
}

/**
 * Hook for A/B testing and experiments
 */
export function useExperiments() {
  const { trackEvent, isInitialized } = useAnalytics();

  // Track experiment exposure
  const trackExposure = useCallback((experimentId: string, variant: string) => {
    if (!isInitialized) return;
    
    trackEvent("experiment_exposure", {
      experiment_id: experimentId,
      variant,
    });
  }, [trackEvent, isInitialized]);

  // Track experiment conversion
  const trackExperimentConversion = useCallback((experimentId: string, variant: string, conversionType: string, value?: number) => {
    if (!isInitialized) return;
    
    trackEvent("experiment_conversion", {
      experiment_id: experimentId,
      variant,
      conversion_type: conversionType,
      conversion_value: value,
    });
  }, [trackEvent, isInitialized]);

  return {
    trackExposure,
    trackExperimentConversion,
  };
}

/**
 * Hook to track page performance
 */
export function usePerformanceTracking() {
  const { trackEvent, isInitialized } = useAnalytics();

  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    // Track Core Web Vitals when available
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          trackEvent("web_vital", {
            metric: 'LCP',
            value: Math.round(entry.startTime),
          });
        } else if (entry.entryType === 'first-input') {
          const fidEntry = entry as PerformanceEventTiming;
          trackEvent("web_vital", {
            metric: 'FID',
            value: Math.round(fidEntry.processingStart - fidEntry.startTime),
          });
        } else if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          trackEvent("web_vital", {
            metric: 'CLS',
            value: Math.round((entry as any).value * 1000),
          });
        }
      }
    });

    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      observer.observe({ type: 'first-input', buffered: true });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Performance observer not supported
    }

    return () => observer.disconnect();
  }, [trackEvent, isInitialized]);

  // Track API call performance
  const trackApiCall = useCallback((endpoint: string, durationMs: number, success: boolean, statusCode?: number) => {
    if (!isInitialized) return;
    
    trackEvent("api_performance", {
      endpoint,
      duration_ms: durationMs,
      success,
      status_code: statusCode,
    });
  }, [trackEvent, isInitialized]);

  return {
    trackApiCall,
  };
}
