/**
 * Firebase Analytics Service Implementation
 */

import { getAnalytics, logEvent as firebaseLogEvent, setUserId as firebaseSetUserId, setUserProperties as firebaseSetUserProperties, Analytics as FirebaseAnalytics, CustomParams } from 'firebase/analytics';
import { getApp } from 'firebase/app';
import { AnalyticsEvent, UserProperties, ANALYTICS_EVENTS } from './analytics-events';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error categories for better handling
export type ErrorCategory = 
  | 'authentication' 
  | 'authorization' 
  | 'validation' 
  | 'rate_limit' 
  | 'subscription' 
  | 'file_upload' 
  | 'network' 
  | 'server' 
  | 'unknown';

// Main analytics service class
export class FirebaseAnalyticsService {
  private analytics: FirebaseAnalytics | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  // Initialize Firebase Analytics
  public initialize(): void {
    try {
      if (typeof window !== 'undefined') {
        const app = getApp();
        this.analytics = getAnalytics(app);
        this.isInitialized = true;
        console.log('[Analytics] Firebase Analytics initialized successfully');
      }
    } catch (error) {
      console.warn('[Analytics] Failed to initialize Firebase Analytics:', error);
      this.isInitialized = false;
    }
  }

  // Core logging method
  async logEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.isInitialized || !this.analytics) {
      console.warn('[Analytics] Analytics not initialized, skipping event:', event.name);
      return;
    }

    try {
      await firebaseLogEvent(this.analytics, event.name, event.parameters);
      console.log(`[Analytics] Event logged: ${event.name}`, event.parameters);
    } catch (error) {
      console.error('[Analytics] Failed to log event:', error);
    }
  }

  // User identification methods
  async setUserId(userId: string): Promise<void> {
    if (!this.isInitialized || !this.analytics) {
      console.warn('[Analytics] Analytics not initialized, skipping user ID set');
      return;
    }

    try {
      await firebaseSetUserId(this.analytics, userId);
      console.log('[Analytics] User ID set:', userId);
    } catch (error) {
      console.error('[Analytics] Failed to set user ID:', error);
    }
  }

  async clearUserId(): Promise<void> {
    if (!this.isInitialized || !this.analytics) {
      console.warn('[Analytics] Analytics not initialized, skipping user ID clear');
      return;
    }

    try {
      await firebaseSetUserId(this.analytics, null);
      console.log('[Analytics] User ID cleared');
    } catch (error) {
      console.error('[Analytics] Failed to clear user ID:', error);
    }
  }

  async setUserProperties(properties: UserProperties): Promise<void> {
    if (!this.isInitialized || !this.analytics) {
      console.warn('[Analytics] Analytics not initialized, skipping user properties set');
      return;
    }

    try {
      await firebaseSetUserProperties(this.analytics, properties as CustomParams);
      console.log('[Analytics] User properties set:', properties);
    } catch (error) {
      console.error('[Analytics] Failed to set user properties:', error);
    }
  }

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

  async logPasswordReset(): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.PASSWORD_RESET,
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

  async logJobSaved(jobId: string, jobTitle: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.JOB_SAVED,
      parameters: {
        job_id: jobId,
        job_title: jobTitle,
      },
    });
  }

  async logJobFilterApplied(filterType: string, filterValue: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.JOB_FILTER_APPLIED,
      parameters: {
        filter_type: filterType,
        filter_value: filterValue,
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

  async logCvDeleted(cvId: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.CV_DELETED,
      parameters: {
        cv_id: cvId,
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

  async logApplicationUpdated(applicationId: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.APPLICATION_UPDATED,
      parameters: {
        application_id: applicationId,
      },
    });
  }

  async logApplicationDeleted(applicationId: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.APPLICATION_DELETED,
      parameters: {
        application_id: applicationId,
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

  async logDashboardWidgetClicked(widgetName: string, widgetType: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.DASHBOARD_WIDGET_CLICKED,
      parameters: {
        widget_name: widgetName,
        widget_type: widgetType,
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

  // Performance tracking
  async logPageLoadTime(pageName: string, loadTimeMs: number): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.PAGE_LOAD_TIME,
      parameters: {
        page_name: pageName,
        load_time_ms: loadTimeMs,
      },
    });
  }

  // Subscription events
  async logSubscriptionUpgrade(previousPlan: string, newPlan: string, price: number, currency: string = 'usd'): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.SUBSCRIPTION_UPGRADED,
      parameters: {
        previous_plan: previousPlan,
        new_plan: newPlan,
        price,
        currency,
      },
    });
  }

  // Additional missing methods
  async logJobShared(jobId: string, shareMethod: string, jobTitle: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.JOB_SHARED,
      parameters: {
        job_id: jobId,
        share_method: shareMethod,
        job_title: jobTitle,
      },
    });
  }

  async logPageView(pageName: string, pageTitle?: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.PAGE_VIEW,
      parameters: {
        page_name: pageName,
        page_title: pageTitle,
      },
    });
  }

  async logTimeSpent(pageName: string, timeSpentSeconds: number): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.TIME_SPENT,
      parameters: {
        page_name: pageName,
        time_spent_seconds: timeSpentSeconds,
      },
    });
  }

  async logApiCallTime(apiEndpoint: string, callDurationMs: number, success: boolean): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.API_CALL_TIME,
      parameters: {
        api_endpoint: apiEndpoint,
        call_duration_ms: callDurationMs,
        success,
      },
    });
  }

  // Getter for initialization status
  get isReady(): boolean {
    return this.isInitialized;
  }

  // Additional missing methods
  async logSubscriptionDowngraded(previousPlan: string, newPlan: string, reason?: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.SUBSCRIPTION_DOWNGRADED,
      parameters: {
        previous_plan: previousPlan,
        new_plan: newPlan,
        reason,
      },
    });
  }

  async logTrialStarted(trialType: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.TRIAL_STARTED,
      parameters: {
        trial_type: trialType,
      },
    });
  }

  async logTrialConverted(trialType: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.TRIAL_CONVERTED,
      parameters: {
        trial_type: trialType,
      },
    });
  }

  async logDashboardFilterUsed(filterType: string, filterValue: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.DASHBOARD_FILTER_USED,
      parameters: {
        filter_type: filterType,
        filter_value: filterValue,
      },
    });
  }

  async logDashboardExportUsed(exportType: string, format: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.DASHBOARD_EXPORT_USED,
      parameters: {
        export_type: exportType,
        format,
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

  async logValidationError(field: string, errorMessage: string, context?: Record<string, any>): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.VALIDATION_ERROR,
      parameters: {
        field,
        error_message: errorMessage,
        ...context,
      },
    });
  }

  async logNetworkError(apiEndpoint: string, errorMessage: string, statusCode?: number): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.NETWORK_ERROR,
      parameters: {
        api_endpoint: apiEndpoint,
        error_message: errorMessage,
        status_code: statusCode,
      },
    });
  }

  async logAuthError(errorType: string, errorMessage: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.AUTH_ERROR,
      parameters: {
        error_type: errorType,
        error_message: errorMessage,
      },
    });
  }

  async logUserEngagement(action: string, context?: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.USER_ENGAGEMENT,
      parameters: {
        action,
        context,
      },
    });
  }

  async logSessionDuration(durationMinutes: number): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.SESSION_DURATION,
      parameters: {
        duration_minutes: durationMinutes,
      },
    });
  }

  async logSearchPerformed(query: string, resultCount: number, searchType: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.SEARCH_PERFORMED,
      parameters: {
        search_query: query,
        result_count: resultCount,
        search_type: searchType,
      },
    });
  }

  async logSearchFilterUsed(filterType: string, filterValue: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.SEARCH_FILTER_USED,
      parameters: {
        filter_type: filterType,
        filter_value: filterValue,
      },
    });
  }

  async logSearchResultClicked(resultPosition: number, resultTitle: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.SEARCH_RESULT_CLICKED,
      parameters: {
        result_position: resultPosition,
        result_title: resultTitle,
      },
    });
  }

  async logSocialShareClicked(platform: string, contentType: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.SOCIAL_SHARE_CLICKED,
      parameters: {
        platform,
        content_type: contentType,
      },
    });
  }

  async logReferralUsed(referralCode: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.REFERRAL_USED,
      parameters: {
        referral_code: referralCode,
      },
    });
  }

  async logInvitationSent(recipientEmail: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.INVITATION_SENT,
      parameters: {
        recipient_email: recipientEmail,
      },
    });
  }

  async logGoalCompleted(goalType: string, goalName: string, value?: number): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.GOAL_COMPLETED,
      parameters: {
        goal_type: goalType,
        goal_name: goalName,
        value,
      },
    });
  }

  // Additional missing methods for analytics-index
  async logJobSponsorCheck(jobId: string, isSponsored: boolean, company: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.JOB_SPONSOR_CHECK,
      parameters: {
        job_id: jobId,
        is_sponsored: isSponsored,
        company,
      },
    });
  }

  async logJobImport(source: string, jobCount: number): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.JOB_IMPORTED,
      parameters: {
        source,
        job_count: jobCount,
      },
    });
  }

  async logExtensionPopupOpened(): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.EXTENSION_POPUP_OPENED,
    });
  }

  async logExtensionJobChecked(checkType: 'sponsorship' | 'details', result: 'success' | 'error'): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.EXTENSION_JOB_CHECKED,
      parameters: {
        check_type: checkType,
        result,
      },
    });
  }

  async logExtensionJobAdded(source: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.EXTENSION_JOB_ADDED,
      parameters: {
        source,
      },
    });
  }

  async logExtensionAutofillUsed(dataType: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.EXTENSION_AUTOFILL_USED,
      parameters: {
        data_type: dataType,
      },
    });
  }

  async logExtensionConnected(): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.EXTENSION_CONNECTED,
    });
  }

  async logExtensionDisconnected(): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.EXTENSION_DISCONNECTED,
    });
  }

  async logArticleViewed(articleId: string, articleTitle: string, category: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.ARTICLE_VIEWED,
      parameters: {
        article_id: articleId,
        article_title: articleTitle,
        category,
      },
    });
  }

  async logArticleShared(articleId: string, shareMethod: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.ARTICLE_SHARED,
      parameters: {
        article_id: articleId,
        share_method: shareMethod,
      },
    });
  }

  async logVideoWatched(videoId: string, videoTitle: string, duration: number): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.VIDEO_WATCHED,
      parameters: {
        video_id: videoId,
        video_title: videoTitle,
        duration_seconds: duration,
      },
    });
  }

  async logSettingsUpdated(settingCategory: string, settingName: string): Promise<void> {
    await this.logEvent({
      name: ANALYTICS_EVENTS.SETTINGS_UPDATED,
      parameters: {
        setting_category: settingCategory,
        setting_name: settingName,
      },
    });
  }
}
