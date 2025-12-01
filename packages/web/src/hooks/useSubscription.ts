"use client";

// Re-export from the provider for backward compatibility
// The actual implementation is now in the subscription provider to ensure single API call
export { 
  useSubscription, 
  type SubscriptionActions, 
  type SubscriptionState 
} from "@/providers/subscription-provider";
