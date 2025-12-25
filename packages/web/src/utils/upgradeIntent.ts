import { analytics } from "@/firebase/analytics";

export type UpgradeIntentDetail = {
  feature?: string;
  title?: string;
  description?: string;
  source?: string;
};

/**
 * Dispatches a global upgrade intent event. Returns true if a listener handled the event
 * (i.e., called preventDefault), otherwise false.
 */
export function dispatchUpgradeIntent(detail: UpgradeIntentDetail): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  analytics.logFeatureUsed("upgrade_intent", JSON.stringify(detail));

  const event = new CustomEvent<UpgradeIntentDetail>("hireall:open-upgrade", {
    detail,
    cancelable: true,
  });

  // dispatchEvent returns false when preventDefault is called
  return !window.dispatchEvent(event);
}
