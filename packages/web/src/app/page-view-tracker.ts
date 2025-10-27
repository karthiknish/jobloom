"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { analyticsService } from "@/firebase/analytics";

interface PageViewTrackerOptions {
  enableAutoTracking?: boolean;
  enableTimeTracking?: boolean;
  enableScrollDepthTracking?: boolean;
  enableEngagementTracking?: boolean;
  enablePerformanceTracking?: boolean;
}

interface PageData {
  url: string;
  title?: string;
  referrer?: string;
  timestamp: number;
  startTime: number;
  scrollDepth: number;
  engagementEvents: number;
}

const defaultOptions: PageViewTrackerOptions = {
  enableAutoTracking: true,
  enableTimeTracking: true,
  enableScrollDepthTracking: true,
  enableEngagementTracking: true,
  enablePerformanceTracking: true,
};

export function usePageViewTracker(options: PageViewTrackerOptions = defaultOptions) {
  const { enableAutoTracking, enableTimeTracking, enableScrollDepthTracking, enableEngagementTracking, enablePerformanceTracking } = {
    ...defaultOptions,
    ...options,
  };

  const pathname = usePathname();
  const [currentPageData, setCurrentPageData] = useState<PageData | null>(null);
  const pageStartTimeRef = useRef<number>(Date.now());
  const scrollDepthRef = useRef<number>(0);
  const engagementEventsRef = useRef<number>(0);
  const lastScrollPositionRef = useRef<number>(0);

  // Device detection utilities
  const getDeviceType = useCallback((): string => {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent;
    
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
      return 'tablet';
    }
    
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
      return 'mobile';
    }
    
    return 'desktop';
  }, []);

  const getBrowserInfo = useCallback(() => {
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
  }, []);

  const getPageLoadPerformance = useCallback(() => {
    if (typeof window === 'undefined' || !window.performance) return null;

    const timing = window.performance.timing;
    const navigation = window.performance.navigation;

    return {
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart,
      firstPaint: timing.responseStart - timing.navigationStart,
      navigationType: navigation.type,
      redirectCount: navigation.redirectCount,
    };
  }, []);

  const trackPageView = useCallback(async (pageUrl: string) => {
    if (!analyticsService.isReady || !enableAutoTracking) return;

    const pageTitle = document.title || 'Untitled Page';
    const referrer = document.referrer || 'direct';
    const timestamp = Date.now();
    const deviceType = getDeviceType();
    const browserInfo = getBrowserInfo();
    const performance = getPageLoadPerformance();

    const pageData: PageData = {
      url: pageUrl,
      title: pageTitle,
      referrer,
      timestamp,
      startTime: timestamp,
      scrollDepth: 0,
      engagementEvents: 0,
    };

    // Track page view
    await analyticsService.logPageView(pageUrl, pageTitle);

    // Track page performance
    if (enablePerformanceTracking && performance) {
      await analyticsService.logPageLoadTime(pageUrl, performance.loadComplete);
      
      // Track additional performance metrics
      await analyticsService.logEvent({
        name: 'page_performance',
        parameters: {
          page_url: pageUrl,
          page_title: pageTitle,
          dom_content_loaded: performance.domContentLoaded,
          load_complete: performance.loadComplete,
          first_paint: performance.firstPaint,
          navigation_type: performance.navigationType,
          redirect_count: performance.redirectCount,
          device_type: deviceType,
          browser_name: browserInfo.name,
          browser_version: browserInfo.version,
        },
      });
    }

    setCurrentPageData(pageData);
    pageStartTimeRef.current = timestamp;
    scrollDepthRef.current = 0;
    engagementEventsRef.current = 0;
    lastScrollPositionRef.current = 0;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[PageViewTracker] Tracked page view: ${pageUrl}`);
    }
  }, [
    enableAutoTracking,
    enablePerformanceTracking,
    getDeviceType,
    getBrowserInfo,
    getPageLoadPerformance,
  ]);

  const trackTimeOnPage = useCallback(async () => {
    if (!currentPageData || !analyticsService.isReady || !enableTimeTracking) return;

    const timeSpent = Math.floor((Date.now() - currentPageData.startTime) / 1000);
    await analyticsService.logTimeSpent(currentPageData.url, timeSpent);
  }, [currentPageData, enableTimeTracking]);

  const trackScrollDepth = useCallback(() => {
    if (!currentPageData || !analyticsService.isReady || !enableScrollDepthTracking) return;

    const currentScroll = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = Math.min(100, Math.round((currentScroll / documentHeight) * 100));

    if (scrollPercentage > scrollDepthRef.current) {
      scrollDepthRef.current = scrollPercentage;
      
      // Track scroll depth milestones
      const milestones = [25, 50, 75, 90, 100];
      milestones.forEach(milestone => {
        if (scrollPercentage >= milestone && scrollDepthRef.current < milestone + 5) {
          analyticsService.logEvent({
            name: 'scroll_depth_milestone',
            parameters: {
              page_url: currentPageData.url,
              scroll_depth: milestone,
              time_to_milestone: Math.floor((Date.now() - currentPageData.startTime) / 1000),
            },
          });
        }
      });
    }
  }, [currentPageData, enableScrollDepthTracking]);

  const trackEngagement = useCallback((eventType: string, eventData?: Record<string, any>) => {
    if (!currentPageData || !analyticsService.isReady || !enableEngagementTracking) return;

    engagementEventsRef.current += 1;
    
    analyticsService.logEvent({
      name: 'user_engagement',
      parameters: {
        page_url: currentPageData.url,
        engagement_type: eventType,
        total_engagement_events: engagementEventsRef.current,
        time_on_page: Math.floor((Date.now() - currentPageData.startTime) / 1000),
        ...eventData,
      },
    });
  }, [currentPageData, enableEngagementTracking]);

  // Track page views on pathname change
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname, trackPageView]);

  // Set up scroll tracking
  useEffect(() => {
    if (!enableScrollDepthTracking) return;

    const handleScroll = () => {
      trackScrollDepth();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enableScrollDepthTracking, trackScrollDepth]);

  // Track time on page and cleanup on unload
  useEffect(() => {
    if (!enableTimeTracking) return;

    const handlePageUnload = () => {
      trackTimeOnPage();
    };

    window.addEventListener('beforeunload', handlePageUnload);
    return () => window.removeEventListener('beforeunload', handlePageUnload);
  }, [enableTimeTracking, trackTimeOnPage]);

  // Track time on page periodically
  useEffect(() => {
    if (!enableTimeTracking || !currentPageData) return;

    const interval = setInterval(() => {
      trackTimeOnPage();
    }, 30000); // Track every 30 seconds

    return () => clearInterval(interval);
  }, [enableTimeTracking, currentPageData, trackTimeOnPage]);

  return {
    currentPageData,
    trackPageView,
    trackEngagement,
    trackScrollDepth,
    trackTimeOnPage,
  };
}

export default usePageViewTracker;
