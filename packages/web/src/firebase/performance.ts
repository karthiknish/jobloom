// Firebase Performance Monitoring integration for app performance tracking
import {
  getPerformance,
  trace,
  type FirebasePerformance,
  type PerformanceTrace,
} from "firebase/performance";
import { getPerformanceClient } from "./client";

// Performance monitoring service class
class FirebasePerformanceService {
  private performance: FirebasePerformance | null = null;
  private traces = new Map<string, PerformanceTrace>();

  async initialize(): Promise<void> {
    try {
      const performance = getPerformanceClient();
      if (performance) {
        this.performance = performance;
        console.log('Firebase Performance Monitoring initialized');
      } else {
        console.warn('Firebase Performance Monitoring not available');
      }
    } catch (error) {
      console.warn('Failed to initialize Firebase Performance Monitoring:', error);
    }
  }

  // Start a performance trace
  startTrace(traceName: string): PerformanceTrace | null {
    if (!this.performance) return null;

    try {
      const existingTrace = this.traces.get(traceName);
      if (existingTrace) {
        console.warn(`Trace '${traceName}' already exists`);
        return existingTrace;
      }

      const newTrace = trace(this.performance, traceName);
      this.traces.set(traceName, newTrace);
      newTrace.start();
      return newTrace;
    } catch (error) {
      console.warn(`Failed to start trace '${traceName}':`, error);
      return null;
    }
  }

  // Stop a performance trace
  stopTrace(traceName: string): void {
    const traceInstance = this.traces.get(traceName);
    if (traceInstance) {
      try {
        traceInstance.stop();
        this.traces.delete(traceName);
      } catch (error) {
        console.warn(`Failed to stop trace '${traceName}':`, error);
      }
    }
  }

  // Add attribute to a trace
  setTraceAttribute(traceName: string, attribute: string, value: string): void {
    const traceInstance = this.traces.get(traceName);
    if (traceInstance) {
      try {
        traceInstance.putAttribute(attribute, value);
      } catch (error) {
        console.warn(`Failed to set attribute on trace '${traceName}':`, error);
      }
    }
  }

  // Add metric to a trace
  setTraceMetric(traceName: string, metricName: string, value: number): void {
    const traceInstance = this.traces.get(traceName);
    if (traceInstance) {
      try {
        traceInstance.putMetric(metricName, value);
      } catch (error) {
        console.warn(`Failed to set metric on trace '${traceName}':`, error);
      }
    }
  }

  // Increment metric on a trace
  incrementTraceMetric(traceName: string, metricName: string, incrementBy: number = 1): void {
    const traceInstance = this.traces.get(traceName);
    if (traceInstance) {
      try {
        traceInstance.incrementMetric(metricName, incrementBy);
      } catch (error) {
        console.warn(`Failed to increment metric on trace '${traceName}':`, error);
      }
    }
  }

  // Predefined trace starters for common operations

  // API call tracing
  startApiCall(apiName: string, method: string = 'GET', endpoint?: string): string {
    const traceName = `api_call_${apiName}`;
    const traceInstance = this.startTrace(traceName);

    if (traceInstance) {
      this.setTraceAttribute(traceName, 'api_name', apiName);
      this.setTraceAttribute(traceName, 'method', method);
      if (endpoint) {
        this.setTraceAttribute(traceName, 'endpoint', endpoint);
      }
    }

    return traceName;
  }

  // Database operation tracing
  startDatabaseOperation(operation: string, collection: string): string {
    const traceName = `db_${operation}_${collection}`;
    const traceInstance = this.startTrace(traceName);

    if (traceInstance) {
      this.setTraceAttribute(traceName, 'operation', operation);
      this.setTraceAttribute(traceName, 'collection', collection);
    }

    return traceName;
  }

  // File upload tracing
  startFileUpload(fileName: string, fileSize: number): string {
    const traceName = `file_upload_${fileName}`;
    const traceInstance = this.startTrace(traceName);

    if (traceInstance) {
      this.setTraceAttribute(traceName, 'file_name', fileName);
      this.setTraceAttribute(traceName, 'file_size', fileSize.toString());
      this.setTraceMetric(traceName, 'file_size_bytes', fileSize);
    }

    return traceName;
  }

  // Page load tracing
  startPageLoad(pageName: string): string {
    const traceName = `page_load_${pageName}`;
    const traceInstance = this.startTrace(traceName);

    if (traceInstance) {
      this.setTraceAttribute(traceName, 'page_name', pageName);
    }

    return traceName;
  }

  // Component render tracing
  startComponentRender(componentName: string): string {
    const traceName = `render_${componentName}`;
    const traceInstance = this.startTrace(traceName);

    if (traceInstance) {
      this.setTraceAttribute(traceName, 'component_name', componentName);
    }

    return traceName;
  }

  // User interaction tracing
  startUserInteraction(interactionName: string, elementType?: string): string {
    const traceName = `interaction_${interactionName}`;
    const traceInstance = this.startTrace(traceName);

    if (traceInstance) {
      this.setTraceAttribute(traceName, 'interaction_name', interactionName);
      if (elementType) {
        this.setTraceAttribute(traceName, 'element_type', elementType);
      }
    }

    return traceName;
  }

  // Utility method to wrap async operations
  async traceAsync<T>(
    traceName: string,
    operation: () => Promise<T>,
    attributes?: Record<string, string>
  ): Promise<T> {
    const traceInstance = this.startTrace(traceName);

    if (traceInstance && attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        this.setTraceAttribute(traceName, key, value);
      });
    }

    try {
      const result = await operation();
      return result;
    } catch (error) {
      if (traceInstance) {
        this.setTraceAttribute(traceName, 'error', 'true');
        this.setTraceAttribute(traceName, 'error_message', error instanceof Error ? error.message : 'Unknown error');
      }
      throw error;
    } finally {
      this.stopTrace(traceName);
    }
  }
}

// Create singleton instance
const performanceService = new FirebasePerformanceService();

// Initialize performance monitoring when the module loads
if (typeof window !== 'undefined') {
  performanceService.initialize();
}

// Export service and convenience functions
export { performanceService };

// Convenience functions for direct use
export const startTrace = (traceName: string) => performanceService.startTrace(traceName);
export const stopTrace = (traceName: string) => performanceService.stopTrace(traceName);
export const setTraceAttribute = (traceName: string, attribute: string, value: string) =>
  performanceService.setTraceAttribute(traceName, attribute, value);
export const setTraceMetric = (traceName: string, metricName: string, value: number) =>
  performanceService.setTraceMetric(traceName, metricName, value);
export const incrementTraceMetric = (traceName: string, metricName: string, incrementBy?: number) =>
  performanceService.incrementTraceMetric(traceName, metricName, incrementBy);
export const traceAsync = <T>(
  traceName: string,
  operation: () => Promise<T>,
  attributes?: Record<string, string>
) => performanceService.traceAsync(traceName, operation, attributes);

// Predefined convenience methods
export const performance = {
  // API calls
  traceApiCall: (apiName: string, method?: string, endpoint?: string) =>
    performanceService.startApiCall(apiName, method, endpoint),

  // Database operations
  traceDatabaseOperation: (operation: string, collection: string) =>
    performanceService.startDatabaseOperation(operation, collection),

  // File uploads
  traceFileUpload: (fileName: string, fileSize: number) =>
    performanceService.startFileUpload(fileName, fileSize),

  // Page loads
  tracePageLoad: (pageName: string) =>
    performanceService.startPageLoad(pageName),

  // Component renders
  traceComponentRender: (componentName: string) =>
    performanceService.startComponentRender(componentName),

  // User interactions
  traceUserInteraction: (interactionName: string, elementType?: string) =>
    performanceService.startUserInteraction(interactionName, elementType),

  // Async operation wrapper
  traceAsync,
};
