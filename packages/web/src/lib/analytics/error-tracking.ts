import { analyticsService, ANALYTICS_EVENTS } from "@/firebase/analytics";

// Error categories and severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 
  | 'network_error' 
  | 'client_error' 
  | 'server_error' 
  | 'validation_error' 
  | 'authentication_error'
  | 'permission_error'
  | 'timeout_error'
  | 'parsing_error'
  | 'unknown_error';

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  pageUrl?: string;
  userAgent?: string;
  timestamp: number;
  stackTrace?: string;
  componentName?: string;
  action?: string;
  formData?: Record<string, any>;
  apiEndpoint?: string;
  httpStatusCode?: number;
  requestBody?: any;
  responseHeaders?: Record<string, string>;
  networkConditions?: {
    online: boolean;
    connectionType?: string;
    effectiveType?: string;
  };
  deviceInfo?: {
    deviceType: string;
    browserInfo: {
      name: string;
      version: string;
    };
    screenResolution?: string;
    viewportSize?: string;
  };
}

export interface ErrorReport {
  errorId: string;
  message: string;
  name: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: ErrorContext;
  count: number;
  firstOccurred: number;
  lastOccurred: number;
  timestamp: number;
  resolved?: boolean;
  resolution?: string;
}

// Error tracking service
export class ErrorTrackingService {
  private static instance: ErrorTrackingService;
  private errorCache = new Map<string, ErrorReport>();
  private maxCacheSize = 1000;
  private rateLimitMap = new Map<string, number>();
  readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  readonly MAX_ERRORS_PER_MINUTE = 50;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService();
    }
    return ErrorTrackingService.instance;
  }

  // Set up global error handlers
  private setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    // Unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError(
        new Error(event.message),
        {
          name: event.type,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        {
          category: 'client_error',
          severity: 'medium',
          component: event.error?.stack?.split('\n')?.[1]?.trim() || 'unknown',
        }
      );
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: 'unhandled_promise_rejection', reason: event.reason },
        {
          category: 'client_error',
          severity: 'medium',
          component: 'promise_rejection',
        }
      );
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target && 'src' in event.target) {
        this.trackError(
          new Error(`Resource failed to load: ${(event.target as any).src}`),
          { element: (event.target as unknown as HTMLElement).tagName, src: (event.target as any).src },
          {
            category: 'network_error',
            severity: 'low',
            component: 'resource_loading',
          }
        );
      }
    }, true);
  }

  // Track an error
  async trackError(
    error: Error,
    additionalData?: Record<string, any>,
    options?: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      component?: string;
      action?: string;
    }
  ): Promise<void> {
    try {
      // Check rate limiting
      if (this.isRateLimited(error.message)) {
        console.warn('[ErrorTracking] Error rate limited:', error.message);
        return;
      }

      const errorId = this.generateErrorId(error);
      const context = await this.buildErrorContext(error, additionalData, options);

      // Check if error already exists in cache
      let errorReport = this.errorCache.get(errorId);
      
      if (errorReport) {
        // Update existing error
        errorReport.count += 1;
        errorReport.lastOccurred = Date.now();
        errorReport.context = { ...errorReport.context, ...context };
      } else {
        // Create new error report
        const errorReport: ErrorReport = {
          errorId,
          message: error.message,
          name: error.name,
          category: options?.category || this.categorizeError(error),
          severity: options?.severity || this.determineSeverity(error),
          context,
          count: 1,
          firstOccurred: Date.now(),
          lastOccurred: Date.now(),
          timestamp: Date.now(),
        };

        // Add to cache (manage size)
        if (this.errorCache.size >= this.maxCacheSize) {
          const firstKey = this.errorCache.keys().next().value;
          if (firstKey) {
            this.errorCache.delete(firstKey);
          }
        }
        
        this.errorCache.set(errorId, errorReport);
      }

      // Track in analytics
      if (errorReport) {
        await this.logErrorToAnalytics(errorReport);
      }

      // Notify development environment
      if (process.env.NODE_ENV === 'development') {
        console.error('[ErrorTracking]', errorReport);
      }

    } catch (trackingError) {
      // Prevent error tracking itself from breaking the app
      console.error('[ErrorTracking] Failed to track error:', trackingError);
    }
  }

  // Track network errors
  async trackNetworkError(
    apiEndpoint: string,
    httpStatusCode?: number,
    errorMessage?: string,
    context?: Record<string, any>
  ): Promise<void> {
    const error = new Error(errorMessage || `Network error: ${apiEndpoint}`);
    
    await this.trackError(
      error,
      {
        apiEndpoint,
        httpStatusCode,
        ...context,
      },
      {
        category: this.categorizeHttpError(httpStatusCode),
        severity: this.determineSeverityFromStatus(httpStatusCode),
        component: 'network_request',
      }
    );

    // Also track as network error event
    await analyticsService.logNetworkError(apiEndpoint, errorMessage || 'Unknown network error', httpStatusCode);
  }

  // Track validation errors
  async trackValidationError(
    fieldName: string,
    errorMessage: string,
    formData?: Record<string, any>,
    context?: Record<string, any>
  ): Promise<void> {
    const error = new Error(`Validation error for ${fieldName}: ${errorMessage}`);
    
    await this.trackError(
      error,
      {
        fieldName,
        formData,
        ...context,
      },
      {
        category: 'validation_error',
        severity: 'low',
        component: 'form_validation',
      }
    );

    await analyticsService.logValidationError(fieldName, errorMessage, { ...context, formData });
  }

  // Track authentication errors
  async trackAuthError(
    errorType: string,
    errorMessage: string,
    context?: Record<string, any>
  ): Promise<void> {
    const error = new Error(`Authentication error (${errorType}): ${errorMessage}`);
    
    await this.trackError(
      error,
      {
        errorType,
        ...context,
      },
      {
        category: 'authentication_error',
        severity: 'high',
        component: 'authentication',
      }
    );

    await analyticsService.logAuthError(errorType, errorMessage);
  }

  // Track performance errors
  async trackPerformanceError(
    metricName: string,
    actualValue: number,
    thresholdValue: number,
    context?: Record<string, any>
  ): Promise<void> {
    const error = new Error(`Performance threshold exceeded: ${metricName} (${actualValue} > ${thresholdValue})`);
    
    await this.trackError(
      error,
      {
        metricName,
        actualValue,
        thresholdValue,
        ...context,
      },
      {
        category: 'client_error',
        severity: 'medium',
        component: 'performance_monitoring',
      }
    );

    await analyticsService.logPageLoadTime(metricName, actualValue);
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    topErrors: Array<{ error: ErrorReport; percentage: number }>;
    recentErrors: ErrorReport[];
  } {
    const totalErrors = Array.from(this.errorCache.values()).reduce((sum, error) => sum + error.count, 0);
    
    const errorsByCategory = Array.from(this.errorCache.values()).reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + error.count;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    const errorsBySeverity = Array.from(this.errorCache.values()).reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + error.count;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    const topErrors = Array.from(this.errorCache.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(error => ({
        error,
        percentage: (error.count / totalErrors) * 100,
      }));

    const recentErrors = Array.from(this.errorCache.values())
      .sort((a, b) => b.lastOccurred - a.lastOccurred)
      .slice(0, 20);

    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      topErrors,
      recentErrors,
    };
  }

  // Mark error as resolved
  markErrorResolved(errorId: string, resolution: string): void {
    const error = this.errorCache.get(errorId);
    if (error) {
      error.resolved = true;
      error.resolution = resolution;
    }
  }

  // Clear error cache
  clearCache(): void {
    this.errorCache.clear();
  }

  // Private helper methods
  private generateErrorId(error: Error): string {
    const message = error.message || 'Unknown error';
    const name = error.name || 'Error';
    const stack = error.stack || '';
    const firstStackLine = stack.split('\n')[1]?.trim() || '';
    return btoa(`${name}:${message}:${firstStackLine}`).substring(0, 20);
  }

  private async buildErrorContext(
    error: Error,
    additionalData?: Record<string, any>,
    options?: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      component?: string;
      action?: string;
    }
  ): Promise<ErrorContext> {
    const context: ErrorContext = {
      timestamp: Date.now(),
      stackTrace: error.stack,
      componentName: options?.component,
      action: options?.action,
      ...additionalData,
    };

    if (typeof window !== 'undefined') {
      context.pageUrl = window.location.href;
      context.userAgent = navigator.userAgent;
      context.networkConditions = {
        online: navigator.onLine,
        connectionType: (navigator as any).connection?.effectiveType,
        effectiveType: (navigator as any).connection?.effectiveType,
      };

      // Device info
      const deviceType = this.getDeviceType();
      const browserInfo = this.getBrowserInfo();
      context.deviceInfo = {
        deviceType,
        browserInfo,
        screenResolution: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      };
    }

    return context;
  }

  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (name.includes('network') || message.includes('network') || message.includes('fetch')) {
      return 'network_error';
    }
    if (name.includes('validation') || message.includes('validation') || message.includes('invalid')) {
      return 'validation_error';
    }
    if (name.includes('auth') || message.includes('unauthorized') || message.includes('authentication')) {
      return 'authentication_error';
    }
    if (name.includes('permission') || message.includes('forbidden') || message.includes('access denied')) {
      return 'permission_error';
    }
    if (name.includes('timeout') || message.includes('timeout')) {
      return 'timeout_error';
    }
    if (name.includes('syntax') || message.includes('parse') || message.includes('json')) {
      return 'parsing_error';
    }
    if (name.includes('server') || message.includes('internal server')) {
      return 'server_error';
    }

    return 'client_error';
  }

  private categorizeHttpError(statusCode?: number): ErrorCategory {
    if (!statusCode) return 'network_error';
    
    if (statusCode >= 400 && statusCode < 500) {
      if (statusCode === 401 || statusCode === 403) {
        return 'authentication_error';
      }
      if (statusCode === 422) {
        return 'validation_error';
      }
      return 'client_error';
    }
    
    if (statusCode >= 500) {
      return 'server_error';
    }
    
    return 'network_error';
  }

  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    // Critical errors that prevent core functionality
    if (message.includes('cannot read') || message.includes('undefined') && message.includes('property')) {
      return 'critical';
    }
    
    // High severity errors
    if (message.includes('authentication') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'high';
    }
    
    // Medium severity
    if (message.includes('timeout') || message.includes('network') || message.includes('server')) {
      return 'medium';
    }
    
    return 'low';
  }

  private determineSeverityFromStatus(statusCode?: number): ErrorSeverity {
    if (!statusCode) return 'medium';
    
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400 && statusCode < 500) {
      if (statusCode === 401 || statusCode === 403) return 'high';
      return 'medium';
    }
    
    return 'low';
  }

  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent;
    
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
      return 'tablet';
    }
    
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
      return 'mobile';
    }
    
    return 'desktop';
  }

  private getBrowserInfo(): { name: string; version: string } {
    if (typeof window === 'undefined') return { name: 'unknown', version: 'unknown' };
    
    const userAgent = navigator.userAgent;
    let browserName = 'unknown';
    let browserVersion = 'unknown';

    if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'chrome';
      const match = userAgent.match(/Chrome\/([0-9.]+)/);
      browserVersion = match ? match[1] : 'unknown';
    } else if (userAgent.indexOf('Safari') > -1) {
      browserName = 'safari';
      const match = userAgent.match(/Version\/([0-9.]+)/);
      browserVersion = match ? match[1] : 'unknown';
    } else if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'firefox';
      const match = userAgent.match(/Firefox\/([0-9.]+)/);
      browserVersion = match ? match[1] : 'unknown';
    } else if (userAgent.indexOf('Edge') > -1) {
      browserName = 'edge';
      const match = userAgent.match(/Edge\/([0-9.]+)/);
      browserVersion = match ? match[1] : 'unknown';
    }

    return { name: browserName, version: browserVersion };
  }

  private isRateLimited(errorId: string): boolean {
    const now = Date.now();
    const lastLogged = this.rateLimitMap.get(errorId) || 0;
    
    if (now - lastLogged < this.RATE_LIMIT_WINDOW) {
      return true;
    }
    
    this.rateLimitMap.set(errorId, now);
    
    // Clean old entries
    for (const [key, timestamp] of this.rateLimitMap.entries()) {
      if (now - timestamp > this.RATE_LIMIT_WINDOW) {
        this.rateLimitMap.delete(key);
      }
    }
    
    return this.rateLimitMap.size > this.MAX_ERRORS_PER_MINUTE;
  }

  private async logErrorToAnalytics(errorReport: ErrorReport): Promise<void> {
    try {
      await analyticsService.logEvent({
        name: ANALYTICS_EVENTS.ERROR_OCCURRED,
        parameters: {
          error_id: errorReport.errorId,
          error_name: errorReport.name,
          error_message: errorReport.message,
          error_category: errorReport.category,
          error_severity: errorReport.severity,
          error_count: errorReport.count,
          component_name: errorReport.context.componentName,
          api_endpoint: errorReport.context.apiEndpoint,
          http_status_code: errorReport.context.httpStatusCode,
          page_url: errorReport.context.pageUrl,
          user_agent: errorReport.context.userAgent,
          device_type: errorReport.context.deviceInfo?.deviceType,
          browser_name: errorReport.context.deviceInfo?.browserInfo.name,
          browser_version: errorReport.context.deviceInfo?.browserInfo.version,
          screen_resolution: errorReport.context.deviceInfo?.screenResolution,
          timestamp: errorReport.timestamp,
        },
      });

      // Track severity-specific events
      if (errorReport.severity === 'critical') {
        await analyticsService.logEvent({
          name: 'critical_error',
          parameters: {
            error_id: errorReport.errorId,
            error_message: errorReport.message,
            component: errorReport.context.componentName,
            page_url: errorReport.context.pageUrl,
          },
        });
      }

    } catch (analyticsError) {
      // Don't let analytics errors break error tracking
      console.error('[ErrorTracking] Failed to log to analytics:', analyticsError);
    }
  }
}

export const errorTracking = ErrorTrackingService.getInstance();

// React hook for error tracking
export function useErrorTracking() {
  const trackError = (error: Error, additionalData?: Record<string, any>, options?: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    component?: string;
    action?: string;
  }) => {
    return errorTracking.trackError(error, additionalData, options);
  };

  const trackNetworkError = (apiEndpoint: string, httpStatusCode?: number, errorMessage?: string, context?: Record<string, any>) => {
    return errorTracking.trackNetworkError(apiEndpoint, httpStatusCode, errorMessage, context);
  };

  const trackValidationError = (fieldName: string, errorMessage: string, formData?: Record<string, any>, context?: Record<string, any>) => {
    return errorTracking.trackValidationError(fieldName, errorMessage, formData, context);
  };

  const trackAuthError = (errorType: string, errorMessage: string, context?: Record<string, any>) => {
    return errorTracking.trackAuthError(errorType, errorMessage, context);
  };

  const getErrorStats = () => {
    return errorTracking.getErrorStats();
  };

  return {
    trackError,
    trackNetworkError,
    trackValidationError,
    trackAuthError,
    getErrorStats,
  };
}
