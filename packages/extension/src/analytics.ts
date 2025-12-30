/**
 * PostHog Analytics for HireAll Extension
 *
 * Provides analytics tracking for the extension across
 * background scripts, popup, and content scripts.
 */

import posthog from "posthog-js";
import { getEnv } from "./env";

// PostHog configuration
const POSTHOG_KEY = getEnv("NEXT_PUBLIC_POSTHOG_KEY");
const POSTHOG_HOST = getEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com");

// Track initialization state
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize PostHog analytics
 * Safe to call multiple times - will only initialize once
 */
export async function initAnalytics(): Promise<void> {
  if (isInitialized) return;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    if (!POSTHOG_KEY) {
      console.debug("[Analytics] PostHog key not configured, analytics disabled");
      return;
    }

    try {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        persistence: "localStorage",
        autocapture: false, // Manual capture in extension
        capture_pageview: false, // Manual page tracking
        capture_pageleave: false,
        disable_session_recording: true, // Not supported in extensions
        loaded: (ph) => {
          // Set extension-specific properties
          ph.register({
            platform: "extension",
            extension_version: chrome.runtime.getManifest().version,
          });
        },
      });

      isInitialized = true;
      console.debug("[Analytics] PostHog initialized successfully");
    } catch (error) {
      console.error("[Analytics] Failed to initialize PostHog:", error);
    }
  })();

  return initializationPromise;
}

/**
 * Check if analytics is available
 */
export function isAnalyticsEnabled(): boolean {
  return isInitialized && !!POSTHOG_KEY;
}

/**
 * Identify the current user
 */
export function identifyUser(
  userId: string,
  properties?: {
    email?: string;
    name?: string;
    tier?: string;
    [key: string]: unknown;
  }
): void {
  if (!isAnalyticsEnabled()) return;

  try {
    posthog.identify(userId, {
      ...properties,
      platform: "extension",
    });
  } catch (error) {
    console.error("[Analytics] Failed to identify user:", error);
  }
}

/**
 * Reset user identity (on logout)
 */
export function resetIdentity(): void {
  if (!isAnalyticsEnabled()) return;

  try {
    posthog.reset();
  } catch (error) {
    console.error("[Analytics] Failed to reset identity:", error);
  }
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (!isAnalyticsEnabled()) return;

  try {
    posthog.capture(eventName, {
      ...properties,
      platform: "extension",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Analytics] Failed to track event:", error);
  }
}

/**
 * Track popup opened
 */
export function trackPopupOpened(): void {
  trackEvent("extension_popup_opened");
}

/**
 * Track job saved from LinkedIn
 */
export function trackJobSaved(jobData: {
  company?: string;
  title?: string;
  source?: string;
}): void {
  trackEvent("extension_job_saved", {
    company: jobData.company,
    job_title: jobData.title,
    source: jobData.source || "linkedin",
  });
}

/**
 * Track sponsorship check
 */
export function trackSponsorshipCheck(result: {
  company: string;
  isSponsored: boolean;
  source?: string;
}): void {
  trackEvent("extension_sponsorship_checked", {
    company: result.company,
    is_sponsored: result.isSponsored,
    source: result.source || "linkedin",
  });
}

/**
 * Track extension authentication
 */
export function trackAuth(action: "login" | "logout" | "refresh"): void {
  trackEvent("extension_auth", {
    action,
  });
}

/**
 * Track rate limit hit
 */
export function trackRateLimitHit(endpoint: string): void {
  trackEvent("extension_rate_limit_hit", {
    endpoint,
  });
}

/**
 * Track API error
 */
export function trackApiError(
  endpoint: string,
  statusCode: number,
  errorMessage?: string
): void {
  trackEvent("extension_api_error", {
    endpoint,
    status_code: statusCode,
    error_message: errorMessage,
  });
}

/**
 * Track LinkedIn page visit
 */
export function trackLinkedInPageVisit(pageType: "job" | "company" | "search" | "other"): void {
  trackEvent("extension_linkedin_page", {
    page_type: pageType,
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsed(
  featureName: string,
  metadata?: Record<string, unknown>
): void {
  trackEvent("extension_feature_used", {
    feature: featureName,
    ...metadata,
  });
}

/**
 * Track extension installed/updated
 */
export function trackExtensionInstall(reason: "install" | "update", previousVersion?: string): void {
  trackEvent("extension_installed", {
    reason,
    previous_version: previousVersion,
    current_version: chrome.runtime.getManifest().version,
  });
}

/**
 * Set user properties without tracking an event
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (!isAnalyticsEnabled()) return;

  try {
    posthog.people.set(properties);
  } catch (error) {
    console.error("[Analytics] Failed to set user properties:", error);
  }
}

/**
 * Flush pending events (useful before extension unload)
 */
export function flushEvents(): void {
  if (!isAnalyticsEnabled()) return;

  try {
    // PostHog doesn't have a direct flush method in the browser SDK,
    // but we can ensure pending events are sent
    posthog.capture("$flush", { _flush: true });
  } catch (error) {
    console.error("[Analytics] Failed to flush events:", error);
  }
}

// Export posthog instance for advanced usage
export { posthog };
