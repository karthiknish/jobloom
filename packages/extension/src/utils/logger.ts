// Extension logging utility for structured logging and debugging

// Webpack DefinePlugin injects this at build time
declare const __EXTENSION_BUILD_ENV__: Record<string, string | undefined> | undefined;

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

class ExtensionLogger {
  private static instance: ExtensionLogger;
  private logLevel: LogLevel = LogLevel.INFO;
  private sessionId: string;
  private userId: string | null = null;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.loadConfiguration();
  }

  static getInstance(): ExtensionLogger {
    if (!ExtensionLogger.instance) {
      ExtensionLogger.instance = new ExtensionLogger();
    }
    return ExtensionLogger.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadConfiguration(): void {
    // Load log level from storage
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['extensionLogLevel'], (result) => {
        if (result.extensionLogLevel !== undefined) {
          this.logLevel = result.extensionLogLevel;
        }
      });
    }

    // In development, default to DEBUG level
    if (process.env.NODE_ENV === 'development') {
      this.logLevel = LogLevel.DEBUG;
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ extensionLogLevel: level });
    }
  }

  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(level: LogLevel, component: string, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      userId: this.userId || undefined,
      sessionId: this.sessionId,
    };
  }

  private logToConsole(entry: LogEntry): void {
    // In production, only output errors to console for debugging critical issues
    const isProduction = process.env.NODE_ENV === 'production' || 
                         (typeof __EXTENSION_BUILD_ENV__ !== 'undefined');
    
    if (isProduction && entry.level !== LogLevel.ERROR) {
      return; // Skip non-error logs in production
    }

    const levelName = LogLevel[entry.level];
    const prefix = `[${entry.timestamp}] [${levelName}] [${entry.component}]`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${entry.message}`, entry.data);
        break;
      case LogLevel.INFO:
        console.log(`${prefix} ${entry.message}`, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${entry.message}`, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ${entry.message}`, entry.data);
        break;
    }
  }

  private addToLogHistory(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }
  }

  debug(component: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const entry = this.createLogEntry(LogLevel.DEBUG, component, message, data);
    this.logToConsole(entry);
    this.addToLogHistory(entry);
  }

  info(component: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const entry = this.createLogEntry(LogLevel.INFO, component, message, data);
    this.logToConsole(entry);
    this.addToLogHistory(entry);
  }

  warn(component: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const entry = this.createLogEntry(LogLevel.WARN, component, message, data);
    this.logToConsole(entry);
    this.addToLogHistory(entry);
  }

  error(component: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const entry = this.createLogEntry(LogLevel.ERROR, component, message, data);
    this.logToConsole(entry);
    this.addToLogHistory(entry);
  }

  // Performance logging
  time(component: string, label: string): void {
    this.debug(component, `Timer started: ${label}`);
    console.time(`${component}:${label}`);
  }

  timeEnd(component: string, label: string): void {
    console.timeEnd(`${component}:${label}`);
    this.debug(component, `Timer ended: ${label}`);
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Log extension lifecycle events
  logExtensionEvent(event: string, data?: any): void {
    this.info('Extension', `Lifecycle: ${event}`, data);
  }

  // Log user actions
  logUserAction(action: string, data?: any): void {
    this.info('UserAction', action, data);
  }

  // Log API calls
  logApiCall(endpoint: string, method: string, status?: number, duration?: number, error?: any): void {
    const level = error ? LogLevel.ERROR : status && status >= 400 ? LogLevel.WARN : LogLevel.DEBUG;
    const message = `${method} ${endpoint}${status ? ` (${status})` : ''}${duration ? ` - ${duration}ms` : ''}`;

    if (level === LogLevel.ERROR) {
      this.error('API', message, { error, status, duration });
    } else if (level === LogLevel.WARN) {
      this.warn('API', message, { status, duration });
    } else {
      this.debug('API', message, { status, duration });
    }
  }

  // Log job processing events
  logJobEvent(event: string, jobData: { title?: string; company?: string; url?: string }, data?: any): void {
    this.info('JobTracker', `${event}: ${jobData.title || 'Unknown'} at ${jobData.company || 'Unknown'}`, {
      ...data,
      jobTitle: jobData.title,
      company: jobData.company,
      url: jobData.url,
    });
  }

  // Log sponsorship events
  logSponsorshipEvent(event: string, company: string, data?: any): void {
    this.debug('Sponsorship', `${event}: ${company}`, data);
  }
}

// Export singleton instance
export const logger = ExtensionLogger.getInstance();

// Convenience functions for common logging
export const log = {
  debug: (component: string, message: string, data?: any) => logger.debug(component, message, data),
  info: (component: string, message: string, data?: any) => logger.info(component, message, data),
  warn: (component: string, message: string, data?: any) => logger.warn(component, message, data),
  error: (component: string, message: string, data?: any) => logger.error(component, message, data),

  // Specialized loggers
  extension: (event: string, data?: any) => logger.logExtensionEvent(event, data),
  userAction: (action: string, data?: any) => logger.logUserAction(action, data),
  api: (endpoint: string, method: string, status?: number, duration?: number, error?: any) =>
    logger.logApiCall(endpoint, method, status, duration, error),
  job: (event: string, jobData: any, data?: any) => logger.logJobEvent(event, jobData, data),
  sponsor: (event: string, company: string, data?: any) => logger.logSponsorshipEvent(event, company, data),

  // Performance timing
  time: (component: string, label: string) => logger.time(component, label),
  timeEnd: (component: string, label: string) => logger.timeEnd(component, label),
};