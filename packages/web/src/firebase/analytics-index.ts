/**
 * Main Analytics Index - Exports all analytics functionality
 */

import { FirebaseAnalyticsService } from './analytics-service';
import { AnalyticsEventHandlers } from './analytics-handlers';
import { AnalyticsEvent, UserProperties, ANALYTICS_EVENTS } from './analytics-events';

// Create singleton instance
const analyticsService = new FirebaseAnalyticsService();
const analyticsHandlers = new AnalyticsEventHandlers(analyticsService);

// Initialize analytics when the module loads
if (typeof window !== 'undefined') {
  // Service is already initialized in the constructor
}

// Export the main service and handlers
export { analyticsService, analyticsHandlers };

// Export types and constants
export type { AnalyticsEvent, UserProperties };
export { ANALYTICS_EVENTS };

// Export convenience functions for backward compatibility
export const setAnalyticsUserProperties = (properties: UserProperties) => 
  analyticsService.setUserProperties(properties);

export const setAnalyticsUserId = (userId: string) => 
  analyticsService.setUserId(userId);

export const clearAnalyticsUserId = () => 
  analyticsService.clearUserId();

// Main analytics object with all methods
export const analytics = {
  // Authentication events
  logSignUp: (method: string, userId?: string) => analyticsService.logSignUp(method, userId),
  logLogin: (method: string, userId?: string) => analyticsService.logLogin(method, userId),
  logLogout: () => analyticsService.logLogout(),
  logPasswordReset: () => analyticsService.logPasswordReset(),

  // Job events
  logJobViewed: (jobId: string, jobTitle: string, source: string) => analyticsService.logJobViewed(jobId, jobTitle, source),
  logJobApplied: (jobId: string, applicationId: string, jobTitle: string) => analyticsService.logJobApplied(jobId, applicationId, jobTitle),
  logJobSaved: (jobId: string, jobTitle: string) => analyticsService.logJobSaved(jobId, jobTitle),
  logJobSearch: (query: string, location?: string, resultsCount?: number) => analyticsService.logJobSearch(query, location, resultsCount),
  logJobFilterApplied: (filterType: string, filterValue: string) => analyticsService.logJobFilterApplied(filterType, filterValue),

  // CV/Resume events
  logCvUploaded: (cvId: string, fileSize: number, fileType: string) => analyticsService.logCvUploaded(cvId, fileSize, fileType),
  logCvAnalyzed: (cvId: string, analysisType: string, success: boolean) => analyticsService.logCvAnalyzed(cvId, analysisType, success),
  logCvDeleted: (cvId: string) => analyticsService.logCvDeleted(cvId),

  // Application tracking events
  logApplicationCreated: (applicationId: string, jobId: string, status: string) => analyticsService.logApplicationCreated(applicationId, jobId, status),
  logApplicationUpdated: (applicationId: string) => analyticsService.logApplicationUpdated(applicationId),
  logApplicationDeleted: (applicationId: string) => analyticsService.logApplicationDeleted(applicationId),
  logApplicationStatusChanged: (applicationId: string, oldStatus: string, newStatus: string) => analyticsService.logApplicationStatusChanged(applicationId, oldStatus, newStatus),

  // Dashboard events
  logDashboardViewed: (tab?: string) => analyticsService.logDashboardViewed(tab),
  logDashboardWidgetClicked: (widgetName: string, widgetType: string) => analyticsService.logDashboardWidgetClicked(widgetName, widgetType),

  // Feature usage events
  logFeatureUsed: (featureName: string, context?: string) => analyticsService.logFeatureUsed(featureName, context),

  // Error events
  logValidationError: (field: string, errorMessage: string, context?: Record<string, any>) => analyticsService.logValidationError(field, errorMessage, context),
  logNetworkError: (apiEndpoint: string, errorMessage: string, statusCode?: number) => analyticsService.logNetworkError(apiEndpoint, errorMessage, statusCode),
  logAuthError: (errorType: string, errorMessage: string) => analyticsService.logAuthError(errorType, errorMessage),
  logError: (errorType: string, errorMessage: string, context?: Record<string, any>) => analyticsService.logError(errorType, errorMessage, context),

  // Performance events
  logPageLoadTime: (pageName: string, loadTimeMs: number) => analyticsService.logPageLoadTime(pageName, loadTimeMs),
  logApiCallTime: (apiEndpoint: string, callDurationMs: number, success: boolean) => analyticsService.logApiCallTime(apiEndpoint, callDurationMs, success),
  logPageView: (pageName: string, pageTitle?: string) => analyticsService.logPageView(pageName, pageTitle),
  logTimeSpent: (pageName: string, timeSpentSeconds: number) => analyticsService.logTimeSpent(pageName, timeSpentSeconds),

  // Conversion events
  logSubscriptionUpgraded: (previousPlan: string, newPlan: string, price: number, currency?: string) => analyticsService.logSubscriptionUpgrade(previousPlan, newPlan, price, currency),
  logTrialStarted: (trialType: string) => analyticsService.logTrialStarted(trialType),
  logTrialConverted: (trialType: string) => analyticsService.logTrialConverted(trialType),

  // Engagement tracking
  logUserEngagement: (action: string, context?: string) => analyticsService.logUserEngagement(action, context),
  logSessionDuration: (durationMinutes: number) => analyticsService.logSessionDuration(durationMinutes),

  // Search events
  logSearchPerformed: (query: string, resultCount?: number, searchType?: string) => analyticsService.logSearchPerformed(query, resultCount || 0, searchType || ''),
  logSearchFilterUsed: (filterType: string, filterValue: string) => analyticsService.logSearchFilterUsed(filterType, filterValue),
  logSearchResultClicked: (resultPosition: number, resultTitle: string) => analyticsService.logSearchResultClicked(resultPosition, resultTitle),

  // Social events
  logSocialShareClicked: (platform: string, contentType: string) => analyticsService.logSocialShareClicked(platform, contentType),
  logReferralUsed: (referralCode: string) => analyticsService.logReferralUsed(referralCode),
  logInvitationSent: (recipientEmail: string) => analyticsService.logInvitationSent(recipientEmail),

  // Goal completion tracking
  logGoalCompleted: (goalType: string, goalName: string, value?: number) => analyticsService.logGoalCompleted(goalType, goalName, value),

  // Enhanced job events
  logJobShared: (jobId: string, shareMethod: string, jobTitle: string) => analyticsService.logJobShared(jobId, shareMethod, jobTitle),
  logJobSponsorCheck: (jobId: string, isSponsored: boolean, company: string) => analyticsService.logJobSponsorCheck(jobId, isSponsored, company),
  logJobImport: (source: string, jobCount: number) => analyticsService.logJobImport(source, jobCount),

  // Extension events
  logExtensionPopupOpened: () => analyticsService.logExtensionPopupOpened(),
  logExtensionJobChecked: (checkType: 'sponsorship' | 'details', result: 'success' | 'error') => analyticsService.logExtensionJobChecked(checkType, result),
  logExtensionJobAdded: (source: string) => analyticsService.logExtensionJobAdded(source),
  logExtensionAutofillUsed: (dataType: string) => analyticsService.logExtensionAutofillUsed(dataType),
  logExtensionConnected: () => analyticsService.logExtensionConnected(),
  logExtensionDisconnected: () => analyticsService.logExtensionDisconnected(),

  // Content engagement events
  logArticleViewed: (articleId: string, articleTitle: string, category: string) => analyticsService.logArticleViewed(articleId, articleTitle, category),
  logArticleShared: (articleId: string, shareMethod: string) => analyticsService.logArticleShared(articleId, shareMethod),
  logVideoWatched: (videoId: string, videoTitle: string, duration: number) => analyticsService.logVideoWatched(videoId, videoTitle, duration),

  // Settings events
  logSettingsUpdated: (section: string, action: string) => analyticsService.logSettingsUpdated(section, action),

  // Subscription events
  logSubscriptionDowngraded: (previousPlan: string, newPlan: string, reason?: string) => analyticsService.logSubscriptionDowngraded(previousPlan, newPlan, reason),
};

// Export the service class for direct usage if needed
export { FirebaseAnalyticsService, AnalyticsEventHandlers };
