/**
 * Analytics Event Handlers - Specialized handlers for different event types
 */

import { FirebaseAnalyticsService } from './analytics-service';
import { ANALYTICS_EVENTS } from './analytics-events';

export class AnalyticsEventHandlers {
  constructor(private analyticsService: FirebaseAnalyticsService) {}

  // Job-related event handlers
  async handleJobEvent(eventType: 'viewed' | 'applied' | 'saved' | 'shared', data: {
    jobId: string;
    jobTitle: string;
    source?: string;
    applicationId?: string;
    shareMethod?: string;
  }): Promise<void> {
    switch (eventType) {
      case 'viewed':
        await this.analyticsService.logJobViewed(data.jobId, data.jobTitle, data.source || 'unknown');
        break;
      case 'applied':
        if (data.applicationId) {
          await this.analyticsService.logJobApplied(data.jobId, data.applicationId, data.jobTitle);
        }
        break;
      case 'saved':
        await this.analyticsService.logJobSaved(data.jobId, data.jobTitle);
        break;
      case 'shared':
        if (data.shareMethod) {
          await this.analyticsService.logJobShared(data.jobId, data.shareMethod, data.jobTitle);
        }
        break;
    }
  }

  // CV-related event handlers
  async handleCvEvent(eventType: 'uploaded' | 'analyzed' | 'deleted', data: {
    cvId: string;
    fileSize?: number;
    fileType?: string;
    analysisType?: string;
    success?: boolean;
  }): Promise<void> {
    switch (eventType) {
      case 'uploaded':
        if (data.fileSize && data.fileType) {
          await this.analyticsService.logCvUploaded(data.cvId, data.fileSize, data.fileType);
        }
        break;
      case 'analyzed':
        if (data.analysisType && data.success !== undefined) {
          await this.analyticsService.logCvAnalyzed(data.cvId, data.analysisType, data.success);
        }
        break;
      case 'deleted':
        await this.analyticsService.logCvDeleted(data.cvId);
        break;
    }
  }

  // Application lifecycle handlers
  async handleApplicationEvent(eventType: 'created' | 'updated' | 'deleted' | 'status_changed', data: {
    applicationId: string;
    jobId?: string;
    status?: string;
    oldStatus?: string;
    newStatus?: string;
  }): Promise<void> {
    switch (eventType) {
      case 'created':
        if (data.jobId && data.status) {
          await this.analyticsService.logApplicationCreated(data.applicationId, data.jobId, data.status);
        }
        break;
      case 'updated':
        await this.analyticsService.logApplicationUpdated(data.applicationId);
        break;
      case 'deleted':
        await this.analyticsService.logApplicationDeleted(data.applicationId);
        break;
      case 'status_changed':
        if (data.oldStatus && data.newStatus) {
          await this.analyticsService.logApplicationStatusChanged(
            data.applicationId,
            data.oldStatus,
            data.newStatus
          );
        }
        break;
    }
  }

  // Authentication flow handlers
  async handleAuthEvent(eventType: 'signup' | 'login' | 'logout' | 'password_reset', data: {
    method?: string;
    userId?: string;
  }): Promise<void> {
    switch (eventType) {
      case 'signup':
        if (data.method) {
          await this.analyticsService.logSignUp(data.method, data.userId);
        }
        break;
      case 'login':
        if (data.method) {
          await this.analyticsService.logLogin(data.method, data.userId);
        }
        break;
      case 'logout':
        await this.analyticsService.logLogout();
        break;
      case 'password_reset':
        await this.analyticsService.logPasswordReset();
        break;
    }
  }

  // Performance monitoring handlers
  async handlePerformanceEvent(eventType: 'page_load' | 'api_call', data: {
    pageName?: string;
    loadTimeMs?: number;
    apiEndpoint?: string;
    callDurationMs?: number;
    success?: boolean;
  }): Promise<void> {
    switch (eventType) {
      case 'page_load':
        if (data.pageName && data.loadTimeMs) {
          await this.analyticsService.logPageLoadTime(data.pageName, data.loadTimeMs);
        }
        break;
      case 'api_call':
        if (data.apiEndpoint && data.callDurationMs && data.success !== undefined) {
          await this.analyticsService.logApiCallTime(data.apiEndpoint, data.callDurationMs, data.success);
        }
        break;
    }
  }

  // Subscription and conversion handlers
  async handleSubscriptionEvent(eventType: 'upgraded' | 'downgraded' | 'trial_started' | 'trial_converted', data: {
    previousPlan?: string;
    newPlan?: string;
    price?: number;
    currency?: string;
    trialType?: string;
    reason?: string;
  }): Promise<void> {
    switch (eventType) {
      case 'upgraded':
        if (data.previousPlan && data.newPlan && data.price) {
          await this.analyticsService.logSubscriptionUpgrade(
            data.previousPlan,
            data.newPlan,
            data.price,
            data.currency
          );
        }
        break;
      case 'downgraded':
        if (data.previousPlan && data.newPlan) {
          await this.analyticsService.logSubscriptionDowngraded(
            data.previousPlan,
            data.newPlan,
            data.reason
          );
        }
        break;
      case 'trial_started':
        if (data.trialType) {
          await this.analyticsService.logTrialStarted(data.trialType);
        }
        break;
      case 'trial_converted':
        if (data.trialType) {
          await this.analyticsService.logTrialConverted(data.trialType);
        }
        break;
    }
  }

  // Error handling with categorization
  async handleErrorEvent(error: {
    type: string;
    message: string;
    category?: 'validation' | 'network' | 'auth' | 'server' | 'unknown';
    context?: Record<string, any>;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<void> {
    await this.analyticsService.logError(error.type, error.message, {
      category: error.category || 'unknown',
      severity: error.severity || 'medium',
      ...error.context,
    });
  }

  // Dashboard interaction handlers
  async handleDashboardEvent(eventType: 'viewed' | 'widget_clicked' | 'filter_used' | 'export_used', data: {
    tab?: string;
    widgetName?: string;
    widgetType?: string;
    filterType?: string;
    filterValue?: string;
    exportType?: string;
    format?: string;
  }): Promise<void> {
    switch (eventType) {
      case 'viewed':
        await this.analyticsService.logDashboardViewed(data.tab);
        break;
      case 'widget_clicked':
        if (data.widgetName && data.widgetType) {
          await this.analyticsService.logDashboardWidgetClicked(data.widgetName, data.widgetType);
        }
        break;
      case 'filter_used':
        if (data.filterType && data.filterValue) {
          await this.analyticsService.logDashboardFilterUsed(data.filterType, data.filterValue);
        }
        break;
      case 'export_used':
        if (data.exportType && data.format) {
          await this.analyticsService.logDashboardExportUsed(data.exportType, data.format);
        }
        break;
    }
  }
}
