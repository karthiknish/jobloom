"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { performanceService } from "@/firebase/performance";
import { performanceMonitoring, type PerformanceMetrics } from "@/lib/analytics/performance-monitoring";

// Performance context type
interface PerformanceContextType {
  isInitialized: boolean;
  metrics: PerformanceMetrics | null;
  startTrace: (name: string) => void;
  stopTrace: (name: string) => void;
  traceAsync: <T>(name: string, operation: () => Promise<T>) => Promise<T>;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

interface PerformanceProviderProps {
  children: React.ReactNode;
  enablePageLoadTracking?: boolean;
  enableWebVitals?: boolean;
  debugMode?: boolean;
}

/**
 * PerformanceProvider
 * 
 * Integrates Firebase Performance monitoring with the app.
 * - Automatically tracks page loads on route changes
 * - Collects Web Vitals metrics
 * - Provides context for manual tracing
 */
export function PerformanceProvider({
  children,
  enablePageLoadTracking = true,
  enableWebVitals = true,
  debugMode = process.env.NODE_ENV === "development",
}: PerformanceProviderProps) {
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const currentTraceRef = useRef<string | null>(null);
  const pageLoadStartRef = useRef<number>(Date.now());

  // Initialize Firebase Performance
  useEffect(() => {
    const initPerformance = async () => {
      try {
        await performanceService.initialize();
        setIsInitialized(true);
        
        if (debugMode) {
          console.log("[PerformanceProvider] Firebase Performance initialized");
        }
      } catch (error) {
        console.warn("[PerformanceProvider] Failed to initialize:", error);
      }
    };

    initPerformance();
  }, [debugMode]);

  // Subscribe to Web Vitals metrics
  useEffect(() => {
    if (!enableWebVitals) return;

    const unsubscribe = performanceMonitoring.onMetricsUpdate((newMetrics) => {
      setMetrics(newMetrics);
      
      if (debugMode) {
        console.log("[PerformanceProvider] Web Vitals update:", {
          FCP: newMetrics.firstContentfulPaint,
          LCP: newMetrics.largestContentfulPaint,
          CLS: newMetrics.cumulativeLayoutShift,
          TBT: newMetrics.totalBlockingTime,
        });
      }
    });

    // Get initial metrics if available
    const currentMetrics = performanceMonitoring.getMetrics();
    if (currentMetrics) {
      setMetrics(currentMetrics);
    }

    return unsubscribe;
  }, [enableWebVitals, debugMode]);

  // Track page loads on route changes
  useEffect(() => {
    if (!isInitialized || !enablePageLoadTracking) return;

    const pageName = pathname?.replace(/\//g, "_").slice(1) || "home";
    const traceName = `page_load_${pageName}`;

    // Stop previous page trace if exists
    if (currentTraceRef.current) {
      const loadDuration = Date.now() - pageLoadStartRef.current;
      performanceService.setTraceMetric(currentTraceRef.current, "load_duration_ms", loadDuration);
      performanceService.stopTrace(currentTraceRef.current);
      
      if (debugMode) {
        console.log(`[PerformanceProvider] Page '${currentTraceRef.current}' load: ${loadDuration}ms`);
      }
    }

    // Start new page trace
    pageLoadStartRef.current = Date.now();
    performanceService.startTrace(traceName);
    performanceService.setTraceAttribute(traceName, "page_path", pathname || "/");
    performanceService.setTraceAttribute(traceName, "timestamp", new Date().toISOString());
    currentTraceRef.current = traceName;

    if (debugMode) {
      console.log(`[PerformanceProvider] Started trace: ${traceName}`);
    }

    // Cleanup on unmount
    return () => {
      if (currentTraceRef.current) {
        performanceService.stopTrace(currentTraceRef.current);
      }
    };
  }, [pathname, isInitialized, enablePageLoadTracking, debugMode]);

  // Context methods
  const startTrace = useCallback((name: string) => {
    performanceService.startTrace(name);
    if (debugMode) {
      console.log(`[PerformanceProvider] Trace started: ${name}`);
    }
  }, [debugMode]);

  const stopTrace = useCallback((name: string) => {
    performanceService.stopTrace(name);
    if (debugMode) {
      console.log(`[PerformanceProvider] Trace stopped: ${name}`);
    }
  }, [debugMode]);

  const traceAsync = useCallback(async <T,>(name: string, operation: () => Promise<T>): Promise<T> => {
    const start = Date.now();
    performanceService.startTrace(name);
    
    try {
      const result = await operation();
      performanceService.setTraceMetric(name, "duration_ms", Date.now() - start);
      performanceService.setTraceAttribute(name, "success", "true");
      return result;
    } catch (error) {
      performanceService.setTraceAttribute(name, "success", "false");
      performanceService.setTraceAttribute(
        name, 
        "error", 
        error instanceof Error ? error.message : "Unknown error"
      );
      throw error;
    } finally {
      performanceService.stopTrace(name);
      if (debugMode) {
        console.log(`[PerformanceProvider] Async trace '${name}': ${Date.now() - start}ms`);
      }
    }
  }, [debugMode]);

  const contextValue: PerformanceContextType = {
    isInitialized,
    metrics,
    startTrace,
    stopTrace,
    traceAsync,
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
}

/**
 * Hook to access performance monitoring context
 */
export function usePerformanceContext() {
  const context = useContext(PerformanceContext);
  
  if (!context) {
    throw new Error("usePerformanceContext must be used within a PerformanceProvider");
  }
  
  return context;
}

/**
 * Hook for tracing specific operations
 */
export function useOperationTrace(operationName: string) {
  const { startTrace, stopTrace, traceAsync, isInitialized } = usePerformanceContext();
  
  const trace = useCallback(() => {
    if (isInitialized) {
      startTrace(operationName);
    }
    return () => {
      if (isInitialized) {
        stopTrace(operationName);
      }
    };
  }, [operationName, startTrace, stopTrace, isInitialized]);

  const traceOperation = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      if (!isInitialized) {
        return operation();
      }
      return traceAsync(operationName, operation);
    },
    [operationName, traceAsync, isInitialized]
  );

  return { trace, traceOperation };
}
