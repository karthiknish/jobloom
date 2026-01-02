"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState } from "react";
import { useFirebaseAuth } from "./firebase-auth-provider";

// Initialize PostHog only on client side
if (typeof window !== "undefined") {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (posthogKey && posthogHost) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: "identified_only",
      capture_pageview: false, // We'll handle this manually for better control
      capture_pageleave: true,
      autocapture: true,
      persistence: "localStorage+cookie",
      bootstrap: {
        distinctID: undefined,
      },
    });
  }
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname && ph) {
      // Skip tracking for admin routes
      if (pathname.startsWith("/admin")) return;

      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`;
      }

      ph.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams, ph]);

  return null;
}

function PostHogUserIdentifier() {
  const { user } = useFirebaseAuth();
  const ph = usePostHog();

  useEffect(() => {
    if (!ph) return;

    if (user) {
      // Identify user in PostHog
      ph.identify(user.uid, {
        email: user.email,
        name: user.displayName,
        emailVerified: user.emailVerified,
      });
    } else {
      // Reset on logout
      ph.reset();
    }
  }, [user, ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isConfigured =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_POSTHOG_KEY &&
    process.env.NEXT_PUBLIC_POSTHOG_HOST;

  // If not configured, just return children
  if (!isConfigured) {
    return <>{children}</>;
  }

  // During SSR and initial client hydration, return null or children directly
  // return children to ensure the HTML structure matches the server
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PostHogUserIdentifier />
      {children}
    </PHProvider>
  );
}

// Export PostHog instance for direct usage
export { posthog };

// Re-export usePostHog hook
export { usePostHog };

// Custom hook for feature flags
export function useFeatureFlag(flagName: string): boolean | undefined {
  const ph = usePostHog();

  if (!ph) return undefined;

  return ph.isFeatureEnabled(flagName);
}

// Custom hook for feature flag with payload
export function useFeatureFlagPayload<T = unknown>(flagName: string): T | undefined {
  const ph = usePostHog();

  if (!ph) return undefined;

  return ph.getFeatureFlagPayload(flagName) as T | undefined;
}

// Helper function to track custom events
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
) {
  if (typeof window !== "undefined" && posthog) {
    posthog.capture(eventName, properties);
  }
}

// Helper function to track form submissions
export function trackFormSubmit(formName: string, success: boolean, metadata?: Record<string, unknown>) {
  trackEvent("form_submitted", {
    form_name: formName,
    success,
    ...metadata,
  });
}

// Helper function to track button clicks
export function trackButtonClick(buttonName: string, context?: string, metadata?: Record<string, unknown>) {
  trackEvent("button_clicked", {
    button_name: buttonName,
    context,
    ...metadata,
  });
}

// Helper function to track errors
export function trackError(errorType: string, errorMessage: string, metadata?: Record<string, unknown>) {
  trackEvent("error_occurred", {
    error_type: errorType,
    error_message: errorMessage,
    ...metadata,
  });
}
