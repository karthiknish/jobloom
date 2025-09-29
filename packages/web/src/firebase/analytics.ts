// Firebase Analytics integration for tracking user behavior and app usage
import {
  logEvent,
  setUserProperties,
  setUserId,
  type Analytics,
} from "firebase/analytics";
import { getAnalyticsClient } from "./client";

// Analytics event types
export interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
}

// User properties interface
export interface UserProperties {
  user_type?: 'free' | 'premium' | 'admin';
  account_age_days?: number;
  jobs_applied_count?: number;
  cv_uploads_count?: number;
  preferred_location?: string;
  preferred_job_type?: string;
  signup_method?: string;
  last_login_date?: string;
}

// Predefined event names for consistency
export const ANALYTICS_EVENTS = {
  // Authentication events
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  LOGOUT: 'logout',

  // Job-related events
  JOB_VIEWED: 'job_viewed',
  JOB_APPLIED: 'job_applied',
  JOB_SAVED: 'job_saved',
  JOB_SEARCHED: 'job_search',
  JOB_FILTER_APPLIED: 'job_filter_applied',

  // CV/Resume events
  CV_UPLOADED: 'cv_uploaded',
  CV_ANALYZED: 'cv_analyzed',
  CV_DELETED: 'cv_deleted',

  // Application tracking events
  APPLICATION_CREATED: 'application_created',
  APPLICATION_UPDATED: 'application_updated',
  APPLICATION_DELETED: 'application_deleted',
  APPLICATION_STATUS_CHANGED: 'application_status_changed',

  // Dashboard events
  DASHBOARD_VIEWED: 'dashboard_viewed',
  DASHBOARD_FILTER_USED: 'dashboard_filter_used',
  DASHBOARD_EXPORT_USED: 'dashboard_export_used',

  // Feature usage events
  FEATURE_USED: 'feature_used',
  SETTINGS_UPDATED: 'settings_updated',

  // Error events
  ERROR_OCCURRED: 'error_occurred',

  // Performance events
  PAGE_VIEW: 'page_view',
  TIME_SPENT: 'time_spent',

  // Conversion events
  GOAL_COMPLETED: 'goal_completed',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
} as const;

// Analytics service class
class FirebaseAnalyticsService {
  private analytics: Analytics | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const analytics = getAnalyticsClient();
      if (analytics) {
        this.analytics = analytics;
        this.isInitialized = true;
        if (process.env.NODE_ENV === 'development') {
          console.info('[Analytics] Firebase Analytics initialized');
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Analytics] Firebase Analytics not available');
        }
      }
    } catch (error) {
      console.warn('[Analytics] Failed to initialize Firebase Analytics:', error);
    }
  }

  // Check if analytics is supported and initialized
  isReady(): boolean {
    return this.isInitialized && !!this.analytics;
  }

  // Log custom events
  async logEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.isReady()) return;

    try {
      logEvent(this.analytics!, event.name, event.parameters);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics] Failed to log event:', event.name, error);
      }
    }
  }

  // Set user properties
  async setUserProperties(properties: UserProperties): Promise<void> {
    if (!this.isReady()) return;

    try {
      setUserProperties(this.analytics!, properties as any);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics] Failed to set user properties:', error);
      }
    }
  }

  // Set user ID
  async setUserId(userId: string): Promise<void> {
    if (!this.isReady()) return;

    try {
      setUserId(this.analytics!, userId);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics] Failed to set user ID:', error);
      }
    }
  }

  // Clear user ID (on logout)
  async clearUserId(): Promise<void> {
    if (!this.isReady()) return;

    try {
      setUserId(this.analytics!, null);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics] Failed to clear user ID:', error);
      }
    }
  }

  // Predefined convenience methods for common events

  // Authentication events
  async logSignUp(method: string, userId?: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.SIGN_UP,
      parameters: {
        method,
        user_id: userId,
      },
    });
  }

  async logLogin(method: string, userId?: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.LOGIN,
      parameters: {
        method,
        user_id: userId,
      },
    });
  }

  async logLogout(): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.LOGOUT,
    });
  }

  // Job events
  async logJobViewed(jobId: string, jobTitle: string, source: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.JOB_VIEWED,
      parameters: {
        job_id: jobId,
        job_title: jobTitle,
        source,
      },
    });
  }

  async logJobApplied(jobId: string, applicationId: string, jobTitle: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.JOB_APPLIED,
      parameters: {
        job_id: jobId,
        application_id: applicationId,
        job_title: jobTitle,
      },
    });
  }

  async logJobSearch(query: string, location?: string, resultsCount?: number): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.JOB_SEARCHED,
      parameters: {
        search_query: query,
        location,
        results_count: resultsCount,
      },
    });
  }

  // CV events
  async logCvUploaded(cvId: string, fileSize: number, fileType: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.CV_UPLOADED,
      parameters: {
        cv_id: cvId,
        file_size: fileSize,
        file_type: fileType,
      },
    });
  }

  async logCvAnalyzed(cvId: string, analysisType: string, success: boolean): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.CV_ANALYZED,
      parameters: {
        cv_id: cvId,
        analysis_type: analysisType,
        success,
      },
    });
  }

  // Application events
  async logApplicationCreated(applicationId: string, jobId: string, status: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.APPLICATION_CREATED,
      parameters: {
        application_id: applicationId,
        job_id: jobId,
        status,
      },
    });
  }

  async logApplicationStatusChanged(applicationId: string, oldStatus: string, newStatus: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.APPLICATION_STATUS_CHANGED,
      parameters: {
        application_id: applicationId,
        old_status: oldStatus,
        new_status: newStatus,
      },
    });
  }

  // Dashboard events
  async logDashboardViewed(tab?: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.DASHBOARD_VIEWED,
      parameters: {
        tab,
      },
    });
  }

  async logFeatureUsed(featureName: string, context?: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.FEATURE_USED,
      parameters: {
        feature_name: featureName,
        context,
      },
    });
  }

  // Error tracking
  async logError(errorType: string, errorMessage: string, context?: Record<string, any>): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.ERROR_OCCURRED,
      parameters: {
        error_type: errorType,
        error_message: errorMessage,
        ...context,
      },
    });
  }

  // Page view tracking
  async logPageView(pageName: string, pageTitle?: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.PAGE_VIEW,
      parameters: {
        page_name: pageName,
        page_title: pageTitle,
      },
    });
  }

  // Time tracking
  async logTimeSpent(pageName: string, timeSpentSeconds: number): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.TIME_SPENT,
      parameters: {
        page_name: pageName,
        time_spent_seconds: timeSpentSeconds,
      },
    });
  }
}

// Create singleton instance
const analyticsService = new FirebaseAnalyticsService();

// Initialize analytics when the module loads
if (typeof window !== 'undefined') {
  analyticsService.initialize();
}

// Export service and convenience functions
export { analyticsService };

// Convenience functions for direct use
export const logAnalyticsEvent = (event: AnalyticsEvent) => analyticsService.logEvent(event);
export const setAnalyticsUserProperties = (properties: UserProperties) => analyticsService.setUserProperties(properties);
export const setAnalyticsUserId = (userId: string) => analyticsService.setUserId(userId);
export const clearAnalyticsUserId = () => analyticsService.clearUserId();

// Predefined event loggers
export const analytics = {
  logSignUp: (method: string, userId?: string) => analyticsService.logSignUp(method, userId),
  logLogin: (method: string, userId?: string) => analyticsService.logLogin(method, userId),
  logLogout: () => analyticsService.logLogout(),

  logJobViewed: (jobId: string, jobTitle: string, source: string) => analyticsService.logJobViewed(jobId, jobTitle, source),
  logJobApplied: (jobId: string, applicationId: string, jobTitle: string) => analyticsService.logJobApplied(jobId, applicationId, jobTitle),
  logJobSearch: (query: string, location?: string, resultsCount?: number) => analyticsService.logJobSearch(query, location, resultsCount),

  logCvUploaded: (cvId: string, fileSize: number, fileType: string) => analyticsService.logCvUploaded(cvId, fileSize, fileType),
  logCvAnalyzed: (cvId: string, analysisType: string, success: boolean) => analyticsService.logCvAnalyzed(cvId, analysisType, success),

  logApplicationCreated: (applicationId: string, jobId: string, status: string) => analyticsService.logApplicationCreated(applicationId, jobId, status),
  logApplicationStatusChanged: (applicationId: string, oldStatus: string, newStatus: string) => analyticsService.logApplicationStatusChanged(applicationId, oldStatus, newStatus),

  logDashboardViewed: (tab?: string) => analyticsService.logDashboardViewed(tab),
  logFeatureUsed: (featureName: string, context?: string) => analyticsService.logFeatureUsed(featureName, context),

  logError: (errorType: string, errorMessage: string, context?: Record<string, any>) => analyticsService.logError(errorType, errorMessage, context),
  logPageView: (pageName: string, pageTitle?: string) => analyticsService.logPageView(pageName, pageTitle),
  logTimeSpent: (pageName: string, timeSpentSeconds: number) => analyticsService.logTimeSpent(pageName, timeSpentSeconds),
};
