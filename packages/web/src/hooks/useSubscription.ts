"use client";

import { useState, useEffect, useCallback } from "react";
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
  currentUsage?: {
    cvAnalyses: number;
    applications: number;
  };
  isLoading: boolean;
  error: string | null;
}

export function useSubscription() {
  const { user } = useFirebaseAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscription: null,
    plan: "free",
    limits: SUBSCRIPTION_LIMITS.free,
    actions: {},
    isLoading: true,
    error: null,
  });

  const fetchSubscription = useCallback(async () => {
    if (!user?.uid) {
      setState({
        subscription: null,
        plan: "free",
        limits: SUBSCRIPTION_LIMITS.free,
        actions: {},
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch("/api/subscription/status", {
        headers: {
          "Authorization": `Bearer ${await user.getIdToken()}`,
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
          isLoading: false,
          error: null,
        });
      } else {
        // Fallback to free plan if API fails
        setState({
          subscription: null,
          plan: "free",
          limits: SUBSCRIPTION_LIMITS.free,
          actions: {},
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
        isLoading: false,
        error: "Failed to load subscription information",
      });
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const hasFeature = useCallback(
    (
      feature: keyof SubscriptionLimits,
      requiredValue?: boolean | number | string | Array<string | number>
    ): boolean => {
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
    [state.limits]
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
    return fetchSubscription();
  }, [fetchSubscription]);

  return {
    ...state,
    hasFeature,
    canUseFeature,
    getRemainingUsage,
    refreshSubscription,
  };
}
