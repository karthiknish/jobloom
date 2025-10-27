/**
 * Analytics event constants and types
 */

// Analytics event types
export interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
}

// User properties interface
export interface UserProperties {
  user_type?: 'free' | 'premium' | 'admin';
  account_age_days?: number;
  jobs_applied_count?: number;
  cv_uploads_count?: number;
  preferred_location?: string;
  preferred_job_type?: string;
  signup_method?: string;
  last_login_date?: string;
}

// Predefined event names for consistency
export const ANALYTICS_EVENTS = {
  // Authentication events
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFIED: 'email_verified',

  // Job-related events
  JOB_VIEWED: 'job_viewed',
  JOB_APPLIED: 'job_applied',
  JOB_SEARCHED: 'job_searched',
  JOB_SAVED: 'job_saved',
  JOB_SHARED: 'job_shared',
  JOB_FILTER_APPLIED: 'job_filter_applied',
  JOB_SPONSOR_CHECK: 'job_sponsor_check',
  JOB_IMPORTED: 'job_imported',

  // CV/Resume events
  CV_UPLOADED: 'cv_uploaded',
  CV_ANALYZED: 'cv_analyzed',
  CV_TEMPLATE_USED: 'cv_template_used',
  CV_DOWNLOAD: 'cv_download',
  CV_DELETED: 'cv_deleted',

  // Application events
  APPLICATION_CREATED: 'application_created',
  APPLICATION_UPDATED: 'application_updated',
  APPLICATION_DELETED: 'application_deleted',
  APPLICATION_STATUS_CHANGED: 'application_status_changed',
  APPLICATION_INTERVIEW_SCHEDULED: 'application_interview_scheduled',
  APPLICATION_OFFER_RECEIVED: 'application_offer_received',

  // Dashboard events
  DASHBOARD_VIEWED: 'dashboard_viewed',
  DASHBOARD_WIDGET_CLICKED: 'dashboard_widget_clicked',
  DASHBOARD_FILTER_USED: 'dashboard_filter_used',
  DASHBOARD_EXPORT_USED: 'dashboard_export_used',

  // Settings events
  SETTINGS_UPDATED: 'settings_updated',
  FEATURE_USED: 'feature_used',

  // Content events
  ARTICLE_VIEWED: 'article_viewed',
  ARTICLE_SHARED: 'article_shared',
  VIDEO_WATCHED: 'video_watched',

  // Interview preparation events
  INTERVIEW_PREP_STARTED: 'interview_prep_started',
  INTERVIEW_QUESTION_ANSWERED: 'interview_question_answered',
  MOCK_INTERVIEW_COMPLETED: 'mock_interview_completed',

  // Extension events
  EXTENSION_POPUP_OPENED: 'extension_popup_opened',
  EXTENSION_JOB_CHECKED: 'extension_job_checked',
  EXTENSION_JOB_ADDED: 'extension_job_added',
  EXTENSION_AUTOFILL_USED: 'extension_autofill_used',
  EXTENSION_CONNECTED: 'extension_connected',
  EXTENSION_DISCONNECTED: 'extension_disconnected',

  // Error events
  ERROR_OCCURRED: 'error_occurred',
  VALIDATION_ERROR: 'validation_error',
  NETWORK_ERROR: 'network_error',
  AUTH_ERROR: 'auth_error',

  // Performance events
  PAGE_VIEW: 'page_view',
  TIME_SPENT: 'time_spent',
  PAGE_LOAD_TIME: 'page_load_time',
  API_CALL_TIME: 'api_call_time',

  // Conversion events
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  TRIAL_STARTED: 'trial_started',
  TRIAL_CONVERTED: 'trial_converted',

  // Engagement events
  USER_ENGAGEMENT: 'user_engagement',
  SESSION_DURATION: 'session_duration',

  // Search events
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_FILTER_USED: 'search_filter_used',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',

  // Social events
  SOCIAL_SHARE_CLICKED: 'social_share_clicked',
  REFERRAL_USED: 'referral_used',
  INVITATION_SENT: 'invitation_sent',

  // Goal events
  GOAL_COMPLETED: 'goal_completed',
} as const;
