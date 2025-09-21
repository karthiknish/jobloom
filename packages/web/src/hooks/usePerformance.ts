// React hooks for Firebase Performance Monitoring
import { useEffect, useCallback, useRef } from 'react';
import { performance, performanceService } from '@/firebase/performance';

// Hook for tracing component renders
export function useComponentPerformance(componentName: string) {
  useEffect(() => {
    const traceName = performance.traceComponentRender(componentName);

    return () => {
      performanceService.stopTrace(traceName);
    };
  }, [componentName]);
}

// Hook for tracing user interactions
export function useInteractionPerformance(interactionName: string, elementType?: string) {
  const traceRef = useRef<string | null>(null);

  const startInteraction = useCallback(() => {
    if (traceRef.current) {
      performanceService.stopTrace(traceRef.current);
    }
    traceRef.current = performance.traceUserInteraction(interactionName, elementType);
  }, [interactionName, elementType]);

  const endInteraction = useCallback(() => {
    if (traceRef.current) {
      performanceService.stopTrace(traceRef.current);
      traceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (traceRef.current) {
        performanceService.stopTrace(traceRef.current);
      }
    };
  }, []);

  return { startInteraction, endInteraction };
}

// Hook for tracing async operations
export function useAsyncPerformance<T extends any[], R>(
  operationName: string,
  asyncFn: (...args: T) => Promise<R>,
  attributes?: Record<string, string>
) {
  const tracedFn = useCallback((...args: T) => {
    return performance.traceAsync(
      `async_${operationName}`,
      () => asyncFn(...args),
      attributes
    );
  }, [operationName, asyncFn, attributes]);

  return tracedFn;
}

// Hook for tracing API calls
export function useApiPerformance(apiName: string) {
  const traceRef = useRef<string | null>(null);

  const startApiCall = useCallback((method: string = 'GET', endpoint?: string) => {
    if (traceRef.current) {
      performanceService.stopTrace(traceRef.current);
    }
    traceRef.current = performance.traceApiCall(apiName, method, endpoint);
    return traceRef.current;
  }, [apiName]);

  const endApiCall = useCallback(() => {
    if (traceRef.current) {
      performanceService.stopTrace(traceRef.current);
      traceRef.current = null;
    }
  }, []);

  const traceApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    method: string = 'GET',
    endpoint?: string
  ): Promise<T> => {
    const traceName = startApiCall(method, endpoint);
    try {
      const result = await apiCall();
      return result;
    } finally {
      performanceService.stopTrace(traceName);
    }
  }, [startApiCall]);

  useEffect(() => {
    return () => {
      if (traceRef.current) {
        performanceService.stopTrace(traceRef.current);
      }
    };
  }, []);

  return { startApiCall, endApiCall, traceApiCall };
}

// Hook for tracing database operations
export function useDatabasePerformance(collection: string) {
  const traceDatabaseOperation = useCallback((operation: string) => {
    const traceName = performance.traceDatabaseOperation(operation, collection);

    return () => {
      performanceService.stopTrace(traceName);
    };
  }, [collection]);

  return { traceDatabaseOperation };
}

// Hook for tracing file uploads
export function useFileUploadPerformance() {
  const traceFileUpload = useCallback((fileName: string, fileSize: number) => {
    const traceName = performance.traceFileUpload(fileName, fileSize);

    return () => {
      performanceService.stopTrace(traceName);
    };
  }, []);

  return { traceFileUpload };
}

// Hook for tracing page loads
export function usePageLoadPerformance(pageName: string) {
  useEffect(() => {
    const traceName = performance.tracePageLoad(pageName);

    // Use Performance API if available for more accurate timing
    if (typeof window !== 'undefined' && window.performance) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes('navigation') || entry.name.includes('paint')) {
            performanceService.setTraceMetric(traceName, entry.name.replace(/[^a-zA-Z0-9]/g, '_'), entry.startTime);
          }
        });
      });

      observer.observe({ entryTypes: ['navigation', 'paint', 'measure'] });

      return () => {
        observer.disconnect();
        performanceService.stopTrace(traceName);
      };
    }

    return () => {
      performanceService.stopTrace(traceName);
    };
  }, [pageName]);
}

// Hook for custom performance measurements
export function useCustomPerformance() {
  const startTrace = useCallback((traceName: string) => {
    return performanceService.startTrace(traceName);
  }, []);

  const stopTrace = useCallback((traceName: string) => {
    performanceService.stopTrace(traceName);
  }, []);

  const setAttribute = useCallback((traceName: string, attribute: string, value: string) => {
    performanceService.setTraceAttribute(traceName, attribute, value);
  }, []);

  const setMetric = useCallback((traceName: string, metricName: string, value: number) => {
    performanceService.setTraceMetric(traceName, metricName, value);
  }, []);

  const incrementMetric = useCallback((traceName: string, metricName: string, incrementBy?: number) => {
    performanceService.incrementTraceMetric(traceName, metricName, incrementBy);
  }, []);

  return {
    startTrace,
    stopTrace,
    setAttribute,
    setMetric,
    incrementMetric,
  };
}

// Hook for measuring time between events
export function useTimingMeasurement(measurementName: string) {
  const startTimeRef = useRef<number | null>(null);
  const traceNameRef = useRef<string | null>(null);

  const startMeasurement = useCallback(() => {
    startTimeRef.current = Date.now();
    traceNameRef.current = `timing_${measurementName}`;
    performanceService.startTrace(traceNameRef.current);
  }, [measurementName]);

  const endMeasurement = useCallback(() => {
    if (startTimeRef.current && traceNameRef.current) {
      const duration = Date.now() - startTimeRef.current;
      performanceService.setTraceMetric(traceNameRef.current, 'duration_ms', duration);
      performanceService.stopTrace(traceNameRef.current);

      startTimeRef.current = null;
      traceNameRef.current = null;

      return duration;
    }
    return 0;
  }, []);

  useEffect(() => {
    return () => {
      if (traceNameRef.current) {
        performanceService.stopTrace(traceNameRef.current);
      }
    };
  }, []);

  return { startMeasurement, endMeasurement };
}
