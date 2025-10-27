/**
 * Analytics Module - Main entry point
 * Re-exports everything from the modular analytics system
 */

// Export all analytics functionality from the modular system
export {
  FirebaseAnalyticsService,
  AnalyticsEventHandlers,
  analyticsService,
  analyticsHandlers,
  analytics,
  setAnalyticsUserProperties,
  setAnalyticsUserId,
  clearAnalyticsUserId,
  ANALYTICS_EVENTS
} from './analytics-index';

// Export types for convenience using export type
export type { AnalyticsEvent, UserProperties } from './analytics-events';
