import React from 'react';
import { analyticsService } from "@/firebase/analytics";

// Performance metrics interface
export interface PerformanceMetrics {
  // Navigation Timing
  domContentLoaded: number;
  loadComplete: number;
  firstByte: number;
  firstPaint: number;
  firstContentfulPaint: number;
  firstMeaningfulPaint?: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  
  // Resource Loading
  totalResources: number;
  resourceLoadTime: number;
  scriptLoadTime: number;
  cssLoadTime: number;
  imageLoadTime: number;
  fontLoadTime: number;
  
  // Network
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  
  // Device/Environment
  deviceType: string;
  browserInfo: { name: string; version: string };
  screenResolution: string;
  viewportSize: string;
  cpuCores?: number;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  
  // User Experience
  pageUrl: string;
  referrer: string;
  userAgent: string;
  timestamp: number;
}

// Web Vitals thresholds
const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 }, // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTI: { good: 3800, needsImprovement: 7300 }, // Time to Interactive
  TBT: { good: 200, needsImprovement: 600 }, // Total Blocking Time
};

// Performance monitoring service
export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private observer: PerformanceObserver | null = null;
  private metrics: PerformanceMetrics | null = null;
  private callbacks: Set<(metrics: PerformanceMetrics) => void> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  // Initialize performance monitoring
  private initializeMonitoring(): void {
    try {
      // Wait for page load to collect initial metrics
      if (document.readyState === 'complete') {
        this.collectMetrics();
      } else {
        window.addEventListener('load', () => {
          setTimeout(this.collectMetrics.bind(this), 0);
        });
      }

      // Set up performance observer for real-time metrics
      this.setupPerformanceObserver();

      // Monitor visibility changes
      this.setupVisibilityObserver();

    } catch (error) {
      console.error('[PerformanceMonitoring] Failed to initialize:', error);
    }
  }

  // Set up performance observer for Web Vitals
  private setupPerformanceObserver(): void {
    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });

      // Observe different entry types
      const entryTypes = [
        'navigation',
        'paint',
        'largest-contentful-paint',
        'first-input',
        'layout-shift',
        'resource',
        'measure',
      ];

      entryTypes.forEach(type => {
        try {
          this.observer!.observe({ entryTypes: [type] });
        } catch (e) {
          // Some entry types might not be supported
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[PerformanceMonitoring] Entry type ${type} not supported:`, e);
          }
        }
      });

    } catch (error) {
      console.error('[PerformanceMonitoring] Failed to setup observer:', error);
    }
  }

  // Monitor page visibility changes
  private setupVisibilityObserver(): void {
    let visibilityStart = Date.now();
    let visibilityHidden = false;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        visibilityHidden = true;
        const timeSpent = Date.now() - visibilityStart;
        this.trackPageVisibilityChange('hidden', timeSpent);
      } else {
        if (visibilityHidden) {
          visibilityStart = Date.now();
          this.trackPageVisibilityChange('visible', 0);
        }
      }
    });
  }

  // Collect performance metrics
  private collectMetrics(): void {
    if (!window.performance) return;

    try {
      const metrics = this.gatherMetrics();
      this.metrics = metrics;

      // Track metrics in analytics
      this.trackPerformanceMetrics(metrics);

      // Notify callbacks
      this.callbacks.forEach(callback => callback(metrics));

      // Check for performance issues
      this.checkPerformanceIssues(metrics);

      if (process.env.NODE_ENV === 'development') {
        console.log('[PerformanceMonitoring] Metrics collected:', metrics);
      }

    } catch (error) {
      console.error('[PerformanceMonitoring] Failed to collect metrics:', error);
    }
  }

  // Gather all performance metrics
  private gatherMetrics(): PerformanceMetrics {
    const performance = window.performance;
    const timing = performance.timing;
    const navigation = performance.navigation;

    // Basic navigation timing
    const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
    const loadComplete = timing.loadEventEnd - timing.navigationStart;
    const firstByte = timing.responseStart - timing.navigationStart;

    // Paint timing
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = this.findPaintEntry(paintEntries, 'first-paint') || 0;
    const firstContentfulPaint = this.findPaintEntry(paintEntries, 'first-contentful-paint') || 0;

    // Estimated Time to Interactive (simplified)
    const timeToInteractive = domContentLoaded + 100; // Simplified calculation

    // Resource analysis
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const resourceAnalysis = this.analyzeResourceEntries(resourceEntries);

    // Network information
    const connection = (navigator as any).connection || {};
    const networkInfo = {
      connectionType: connection.type,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };

    // Device information
    const deviceInfo = this.getDeviceInfo();

    // Web Vitals (need observer for these, using fallback values)
    const lcpEntry = performance.getEntriesByType('largest-contentful-paint').pop();
    const fcpEntry = performance.getEntriesByType('first-contentful-paint').pop();
    const clsEntries = performance.getEntriesByType('layout-shift');
    const fidEntries = performance.getEntriesByType('first-input');

    const largestContentfulPaint = lcpEntry ? Math.round(lcpEntry.startTime) : firstContentfulPaint;
    const cumulativeLayoutShift = this.calculateCLS(clsEntries);
    const firstInputDelay = fidEntries.length > 0 ? Math.round(fidEntries[0].startTime - (fidEntries[0] as any).processingStart) : 0;

    // Calculate Total Blocking Time (simplified)
    const totalBlockingTime = this.calculateTBT(performance);

    return {
      // Navigation Timing
      domContentLoaded,
      loadComplete,
      firstByte,
      firstPaint,
      firstContentfulPaint,
      largestContentfulPaint,
      timeToInteractive,
      totalBlockingTime,
      cumulativeLayoutShift,

      // Resource Loading
      totalResources: resourceAnalysis.total,
      resourceLoadTime: resourceAnalysis.totalLoadTime,
      scriptLoadTime: resourceAnalysis.scriptLoadTime,
      cssLoadTime: resourceAnalysis.cssLoadTime,
      imageLoadTime: resourceAnalysis.imageLoadTime,
      fontLoadTime: resourceAnalysis.fontLoadTime,

      // Network
      ...networkInfo,

      // Device/Environment
      deviceType: deviceInfo.deviceType,
      browserInfo: deviceInfo.browserInfo,
      screenResolution: deviceInfo.screenResolution,
      viewportSize: deviceInfo.viewportSize,
      cpuCores: deviceInfo.cpuCores,
      deviceMemory: deviceInfo.deviceMemory,
      hardwareConcurrency: deviceInfo.hardwareConcurrency,

      // User Experience
      pageUrl: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    };
  }

  // Find paint entry by name
  private findPaintEntry(paintEntries: PerformanceEntry[], name: string): number | null {
    const entry = paintEntries.find(p => p.name === name);
    return entry ? Math.round(entry.startTime) : null;
  }

  // Analyze resource entries
  private analyzeResourceEntries(resourceEntries: PerformanceResourceTiming[]): {
    total: number;
    totalLoadTime: number;
    scriptLoadTime: number;
    cssLoadTime: number;
    imageLoadTime: number;
    fontLoadTime: number;
  } {
    const analysis = {
      total: resourceEntries.length,
      totalLoadTime: 0,
      scriptLoadTime: 0,
      cssLoadTime: 0,
      imageLoadTime: 0,
      fontLoadTime: 0,
    };

    resourceEntries.forEach(entry => {
      const loadTime = entry.responseEnd - entry.startTime;
      analysis.totalLoadTime += loadTime;

      if (entry.initiatorType === 'script') {
        analysis.scriptLoadTime += loadTime;
      } else if (entry.initiatorType === 'style' || entry.initiatorType === 'stylesheet') {
        analysis.cssLoadTime += loadTime;
      } else if (entry.initiatorType === 'img' || entry.initiatorType === 'image') {
        analysis.imageLoadTime += loadTime;
      } else if (entry.initiatorType === 'font') {
        analysis.fontLoadTime += loadTime;
      }
    });

    return analysis;
  }

  // Get device information
  private getDeviceInfo(): {
    deviceType: string;
    browserInfo: { name: string; version: string };
    screenResolution: string;
    viewportSize: string;
    cpuCores?: number;
    deviceMemory?: number;
    hardwareConcurrency?: number;
  } {
    // Device type detection
    const deviceType = this.getDeviceType();

    // Browser information
    const browserInfo = this.getBrowserInfo();

    // Screen and viewport
    const screenResolution = `${screen.width}x${screen.height}`;
    const viewportSize = `${window.innerWidth}x${window.innerHeight}`;

    // Hardware info (if available)
    const cpuCores = (navigator as any).hardwareConcurrency;
    const deviceMemory = (navigator as any).deviceMemory;
    const hardwareConcurrency = (navigator as any).hardwareConcurrency;

    return {
      deviceType,
      browserInfo,
      screenResolution,
      viewportSize,
      cpuCores,
      deviceMemory,
      hardwareConcurrency,
    };
  }

  private getDeviceType(): string {
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

  // Calculate Cumulative Layout Shift
  private calculateCLS(clsEntries: PerformanceEntry[]): number {
    let clsValue = 0;
    clsEntries.forEach(entry => {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    });
    return Math.round(clsValue * 10000) / 10000; // Round to 4 decimal places
  }

  // Calculate Total Blocking Time (simplified)
  private calculateTBT(performance: Performance): number {
    const timing = performance.timing;
    const tti = timing.domContentLoadedEventEnd - timing.navigationStart + 100; // Simplified TTI
    
    let tbt = 0;
    if (window.performance && (window.performance as any).getEntriesByType) {
      const navigationEntries = (window.performance as any).getEntriesByType('navigation')[0];
      if (navigationEntries) {
        const longTasks = (window.performance as any).getEntriesByType('long-task');
        longTasks.forEach((task: any) => {
          if (task.startTime > timing.domContentLoadedEventEnd && task.startTime < tti) {
            tbt += task.duration - 50; // Tasks over 50ms contribute to TBT
          }
        });
      }
    }
    
    return Math.round(tbt);
  }

  // Handle performance entries
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    // Implementation for handling performance entries
  }

  // Track Web Vitals
  private async trackWebVital(name: string, value: number, threshold: { good: number; needsImprovement: number }): Promise<void> {
    const rating = this.getPerformanceRating(value, threshold);
    
    analyticsService.logEvent({
      name: 'web_vital',
      parameters: {
        metric_name: name,
        metric_value: value,
        metric_rating: rating,
        threshold_good: threshold.good,
        threshold_needs_improvement: threshold.needsImprovement,
        page_url: window.location.href,
        device_type: this.getDeviceType(),
        browser_name: this.getBrowserInfo().name,
        timestamp: Date.now(),
      },
    });

    // Track poor performance
    if (rating === 'poor') {
      await analyticsService.logError(
        `Performance issue: ${name}`,
        `Value ${value} exceeds threshold ${threshold.good}`,
        {
          page_url: window.location.href,
          threshold_type: name,
          category: 'performance'
        }
      );
    }
  }

  // Get performance rating
  private getPerformanceRating(value: number, threshold: { good: number; needsImprovement: number }): 'good' | 'needs-improvement' | 'poor' {
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  // Track performance metrics
  private trackPerformanceMetrics(metrics: PerformanceMetrics): void {
    analyticsService.logEvent({
      name: 'page_performance_metrics',
      parameters: {
        dom_content_loaded: metrics.domContentLoaded,
        load_complete: metrics.loadComplete,
        first_byte: metrics.firstByte,
        first_paint: metrics.firstPaint,
        first_contentful_paint: metrics.firstContentfulPaint,
        largest_contentful_paint: metrics.largestContentfulPaint,
        time_to_interactive: metrics.timeToInteractive,
        total_blocking_time: metrics.totalBlockingTime,
        cumulative_layout_shift: metrics.cumulativeLayoutShift,
        total_resources: metrics.totalResources,
        resource_load_time: metrics.resourceLoadTime,
        script_load_time: metrics.scriptLoadTime,
        css_load_time: metrics.cssLoadTime,
        image_load_time: metrics.imageLoadTime,
        font_load_time: metrics.fontLoadTime,
        device_type: metrics.deviceType,
        browser_name: metrics.browserInfo.name,
        browser_version: metrics.browserInfo.version,
        screen_resolution: metrics.screenResolution,
        viewport_size: metrics.viewportSize,
        connection_type: metrics.connectionType,
        effective_type: metrics.effectiveType,
        downlink: metrics.downlink,
        rtt: metrics.rtt,
        save_data: metrics.saveData,
        page_url: metrics.pageUrl,
        referrer: metrics.referrer,
        timestamp: metrics.timestamp,
      },
    });

    // Track page load time specifically
    analyticsService.logPageLoadTime(
      window.location.pathname,
      metrics.loadComplete
    );
  }

  // Check for performance issues
  private checkPerformanceIssues(metrics: PerformanceMetrics): void {
    const issues = [];

    // Check load time
    if (metrics.loadComplete > 5000) {
      issues.push({
        type: 'slow_load_time',
        value: metrics.loadComplete,
        threshold: 5000,
      });
    }

    // Check large CLS
    if (metrics.cumulativeLayoutShift > 0.25) {
      issues.push({
        type: 'high_cls',
        value: metrics.cumulativeLayoutShift,
        threshold: 0.25,
      });
    }

    // Check high TBT
    if (metrics.totalBlockingTime > 600) {
      issues.push({
        type: 'high_tbt',
        value: metrics.totalBlockingTime,
        threshold: 600,
      });
    }

    // Check slow LCP
    if (metrics.largestContentfulPaint > 4000) {
      issues.push({
        type: 'slow_lcp',
        value: metrics.largestContentfulPaint,
        threshold: 4000,
      });
    }

    // Log performance issues
    if (issues.length > 0) {
      analyticsService.logEvent({
        name: 'performance_issues',
        parameters: {
          issues: issues,
          page_url: metrics.pageUrl,
          device_type: metrics.deviceType,
          browser_name: metrics.browserInfo.name,
          timestamp: Date.now(),
        },
      });
    }
  }

  // Track page visibility changes
  private trackPageVisibilityChange(state: 'visible' | 'hidden', timeSpent: number): void {
    analyticsService.logEvent({
      name: 'page_visibility_change',
      parameters: {
        visibility_state: state,
        time_spent_ms: timeSpent,
        page_url: window.location.href,
        timestamp: Date.now(),
      },
    });
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics | null {
    return this.metrics;
  }

  // Subscribe to metrics updates
  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // Manual performance measurement
  measure(name: string, startTime?: number, duration?: number): void {
    if (window.performance && window.performance.mark) {
      try {
        if (startTime) {
          window.performance.mark(`${name}-start`);
          window.performance.mark(`${name}-end`);
          window.performance.measure(name, `${name}-start`, `${name}-end`);
        } else {
          window.performance.mark(`${name}-start`);
        }

        const entries = window.performance.getEntriesByName(name);
        if (entries.length > 0) {
          const measurement = entries[entries.length - 1];
          analyticsService.logEvent({
            name: 'custom_performance_measure',
            parameters: {
              measure_name: name,
              duration: measurement.duration,
              start_time: measurement.startTime,
              page_url: window.location.href,
              timestamp: Date.now(),
            },
          });
        }
      } catch (error) {
        console.error('[PerformanceMonitoring] Failed to measure:', error);
      }
    }
  }

  // Cleanup
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.callbacks.clear();
  }
}

export const performanceMonitoring = PerformanceMonitoringService.getInstance();

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = performanceMonitoring.onMetricsUpdate((newMetrics) => {
      setMetrics(newMetrics);
    });

    // Get initial metrics if available
    const currentMetrics = performanceMonitoring.getMetrics();
    if (currentMetrics) {
      setMetrics(currentMetrics);
    }

    return () => unsubscribe();
  }, []);

  const startMeasure = React.useCallback((name: string) => {
    performanceMonitoring.measure(name);
  }, []);

  const endMeasure = React.useCallback((name: string) => {
    if (window.performance && window.performance.mark) {
      window.performance.mark(`${name}-end`);
      window.performance.measure(name, `${name}-start`, `${name}-end`);
    }
  }, []);

  return {
    metrics,
    isMonitoring,
    startMeasure,
    endMeasure,
    measure: performanceMonitoring.measure.bind(performanceMonitoring),
  };
}
