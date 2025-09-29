"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import {
  analyticsService,
  setAnalyticsUserId,
  clearAnalyticsUserId,
  setAnalyticsUserProperties,
} from "@/firebase/analytics";
import { useRemoteConfig } from "@/hooks/useRemoteConfig";
import { analytics } from "@/firebase/analytics";

interface AnalyticsContextValue {
  isReady: boolean;
  identify: (properties?: Record<string, any>) => void;
  reset: () => void;
  track: (event: string, params?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

export function useAnalyticsContext(): AnalyticsContextValue {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    throw new Error("useAnalyticsContext must be used within AnalyticsProvider");
  }
  return ctx;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useFirebaseAuth();
  const { isAnalyticsEnabled } = useRemoteConfig();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!isAnalyticsEnabled) {
        setReady(false);
        return;
      }

      await analyticsService.initialize();
      if (!cancelled) {
        setReady(true);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [isAnalyticsEnabled]);

  useEffect(() => {
    if (!ready || !isAnalyticsEnabled) return;

    if (user) {
      setAnalyticsUserId(user.uid);
      setAnalyticsUserProperties({
        user_type: user.email?.endsWith("@hireall.com") ? "admin" : undefined,
        signup_method: user.providerData?.[0]?.providerId,
        last_login_date: new Date().toISOString().split("T")[0],
      });
    } else {
      clearAnalyticsUserId();
    }
  }, [ready, isAnalyticsEnabled, user]);

  const value = useMemo<AnalyticsContextValue>(() => ({
    isReady: ready,
    identify: (properties) => {
      if (!ready || !properties) return;
      setAnalyticsUserProperties(properties);
    },
    reset: () => {
      if (!ready) return;
      clearAnalyticsUserId();
    },
    track: (event, params) => {
      if (!ready || !event) return;
      analyticsService.logEvent({ name: event, parameters: params });
    },
  }), [ready]);

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

