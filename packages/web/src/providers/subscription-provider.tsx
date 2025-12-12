"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { Subscription, SubscriptionPlan, SUBSCRIPTION_LIMITS, SubscriptionLimits } from "@/types/api";

export interface SubscriptionActions {
  checkoutUrl?: string;
  customerPortalUrl?: string;
  cancelUrl?: string;
  resumeUrl?: string;
}

export interface SubscriptionState {
  subscription: Subscription | null;
  plan: SubscriptionPlan;
  limits: SubscriptionLimits;
  actions: SubscriptionActions;
  isAdmin: boolean;
  currentUsage?: {
    cvAnalyses: number;
    applications: number;
  };
  isLoading: boolean;
  error: string | null;
}

interface SubscriptionContextType extends SubscriptionState {
  hasFeature: (feature: keyof SubscriptionLimits, requiredValue?: boolean | number | string | Array<string | number>) => boolean;
  canUseFeature: (feature: keyof SubscriptionLimits, currentUsage?: number) => boolean;
  getRemainingUsage: (feature: keyof SubscriptionLimits, currentUsage: number) => number;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useFirebaseAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscription: null,
    plan: "free",
    limits: SUBSCRIPTION_LIMITS.free,
    actions: {},
    isAdmin: false,
    isLoading: true,
    error: null,
  });
  
  // Cache control
  const lastFetchRef = useRef<number>(0);
  const fetchInProgressRef = useRef<Promise<void> | null>(null);
  const userIdRef = useRef<string | null>(null);

  const fetchSubscription = useCallback(async (force = false) => {
    if (!user?.uid) {
      setState({
        subscription: null,
        plan: "free",
        limits: SUBSCRIPTION_LIMITS.free,
        actions: {},
        isAdmin: false,
        isLoading: false,
        error: null,
      });
      lastFetchRef.current = 0;
      userIdRef.current = null;
      return;
    }

    const now = Date.now();
    const userChanged = userIdRef.current !== user.uid;
    
    // Return cached data if still valid and same user
    if (!force && !userChanged && now - lastFetchRef.current < CACHE_DURATION) {
      return;
    }

    // If a fetch is already in progress, wait for it
    if (fetchInProgressRef.current && !userChanged) {
      await fetchInProgressRef.current;
      return;
    }

    // Create the fetch promise
    const fetchPromise = (async () => {
      try {
        // Only show loading on initial fetch or user change
        if (state.isLoading || userChanged) {
          setState(prev => ({ ...prev, isLoading: true, error: null }));
        }

        const token = await user.getIdToken();
        const response = await fetch("/api/subscription/status", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const actions: SubscriptionActions = data.actions ?? {};
          setState({
            subscription: data.subscription,
            plan: data.plan,
            limits: data.limits,
            currentUsage: data.currentUsage,
            actions,
            isAdmin: data.isAdmin === true,
            isLoading: false,
            error: null,
          });
          lastFetchRef.current = Date.now();
          userIdRef.current = user.uid;
        } else {
          // Fallback to free plan if API fails
          setState({
            subscription: null,
            plan: "free",
            limits: SUBSCRIPTION_LIMITS.free,
            actions: {},
            isAdmin: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        setState({
          subscription: null,
          plan: "free",
          limits: SUBSCRIPTION_LIMITS.free,
          actions: {},
          isAdmin: false,
          isLoading: false,
          error: "Failed to load subscription information",
        });
      } finally {
        fetchInProgressRef.current = null;
      }
    })();

    fetchInProgressRef.current = fetchPromise;
    await fetchPromise;
  }, [user, state.isLoading]);

  // Fetch subscription when user changes
  useEffect(() => {
    fetchSubscription();
  }, [user?.uid]); // Only re-run when user ID changes

  const hasFeature = useCallback(
    (
      feature: keyof SubscriptionLimits,
      requiredValue?: boolean | number | string | Array<string | number>
    ): boolean => {
      // Admin override: allow specific premium-only features for admins.
      if (state.isAdmin && feature === "advancedAnalytics") {
        return true;
      }

      const value = state.limits[feature];

      if (typeof value === "boolean") {
        return value;
      }

      if (typeof value === "number") {
        if (requiredValue !== undefined) {
          if (typeof requiredValue === "number") {
            if (requiredValue === -1) {
              return value === -1;
            }
            return value === -1 || value >= requiredValue;
          }

          if (requiredValue === "unlimited") {
            return value === -1;
          }
        }

        return value === -1 || value > 0;
      }

      if (Array.isArray(value)) {
        if (requiredValue !== undefined) {
          if (Array.isArray(requiredValue)) {
            return requiredValue.every((item) =>
              value.includes(typeof item === "string" ? item : String(item))
            );
          }

          const lookup =
            typeof requiredValue === "string"
              ? requiredValue
              : String(requiredValue);
          return value.includes(lookup);
        }

        return value.length > 0;
      }

      return false;
    },
    [state.isAdmin, state.limits]
  );

  const canUseFeature = useCallback((feature: keyof SubscriptionLimits, currentUsage?: number): boolean => {
    const limit = state.limits[feature];

    if (typeof limit === 'boolean') {
      return limit;
    }

    if (typeof limit === 'number') {
      if (limit === -1) return true; // unlimited
      if (currentUsage !== undefined) {
        return currentUsage < limit;
      }
      return true; // assume OK if no current usage provided
    }

    if (Array.isArray(limit)) {
      return limit.length > 0;
    }

    return false;
  }, [state.limits]);

  const getRemainingUsage = useCallback((feature: keyof SubscriptionLimits, currentUsage: number): number => {
    const limit = state.limits[feature];

    if (typeof limit === 'number') {
      if (limit === -1) return -1; // unlimited
      return Math.max(0, limit - currentUsage);
    }

    return 0;
  }, [state.limits]);

  const refreshSubscription = useCallback(() => {
    return fetchSubscription(true); // Force refresh
  }, [fetchSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        ...state,
        hasFeature,
        canUseFeature,
        getRemainingUsage,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    // Return a default state if used outside provider (backward compatibility)
    return {
      subscription: null,
      plan: "free" as SubscriptionPlan,
      limits: SUBSCRIPTION_LIMITS.free,
      actions: {},
      isAdmin: false,
      isLoading: false,
      error: null,
      hasFeature: () => false,
      canUseFeature: () => false,
      getRemainingUsage: () => 0,
      refreshSubscription: async () => {},
    };
  }
  return context;
}
