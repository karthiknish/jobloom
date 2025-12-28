/**
 * Centralized notification and toast messages
 */

export const NOTIFICATION_MESSAGES = {
  // Authentication messages
  AUTH: {
    SIGN_IN_SUCCESS: "Successfully signed in!",
    SIGN_OUT_SUCCESS: "Successfully signed out!",
    SIGN_IN_ERROR: "Failed to sign in. Please check your credentials.",
    SIGN_UP_SUCCESS: "Account created successfully!",
    SIGN_UP_ERROR: "Failed to create account. Please try again.",
    SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  },

  // Settings messages
  SETTINGS: {
    PROFILE_SAVED: "Profile updated successfully!",
    PREFERENCES_SAVED: "Preferences saved successfully!",
    PASSWORD_CHANGED: "Password changed successfully!",
    SETTINGS_ERROR: "Failed to save settings. Please try again.",
    AVATAR_UPLOADED: "Profile picture updated successfully!",
    AVATAR_ERROR: "Failed to upload profile picture.",
  },

  // Job management messages
  JOBS: {
    CREATED: "Job added successfully!",
    UPDATED: "Job updated successfully!",
    DELETED: "Job deleted successfully!",
    BULK_UPDATED: "Jobs updated successfully!",
    IMPORT_STARTED: "Job import started. This may take a moment.",
    IMPORT_SUCCESS: "Jobs imported successfully!",
    IMPORT_ERROR: "Failed to import jobs. Please check the file format.",
    IMPORT_PARTIAL: "Some jobs were imported successfully.",
  },

  // Application management messages
  APPLICATIONS: {
    CREATED: "Application added successfully!",
    UPDATED: "Application updated successfully!",
    DELETED: "Application deleted successfully!",
    STATUS_CHANGED: "Application status updated successfully!",
    BULK_UPDATED: "Applications updated successfully!",
    FOLLOW_UP_SET: "Follow-up reminder set successfully!",
    FOLLOW_UP_REMOVED: "Follow-up reminder removed successfully!",
  },

  // CV/Resume messages
  CV: {
    UPLOAD_SUCCESS: "Resume uploaded successfully!",
    ANALYSIS_STARTED: "Resume analysis started. This may take a moment.",
    ANALYSIS_COMPLETE: "Resume analysis complete!",
    ANALYSIS_ERROR: "Failed to analyze resume. Please try again.",
    IMPROVEMENTS_GENERATED: "Resume improvements generated successfully!",
    DOWNLOAD_SUCCESS: "Resume downloaded successfully!",
    DOWNLOAD_ERROR: "Failed to download resume.",
  },

  // Dashboard messages
  DASHBOARD: {
    LOADING: "Loading dashboard data...",
    DATA_REFRESHED: "Dashboard data refreshed successfully!",
    WIDGET_UPDATED: "Widget updated successfully!",
    LAYOUT_SAVED: "Dashboard layout saved successfully!",
  },

  // Extension messages
  EXTENSION: {
    INSTALLED: "Chrome extension detected and connected!",
    NOT_INSTALLED: "Chrome extension not detected. Please install it for automatic job detection.",
    SYNC_SUCCESS: "Jobs synced successfully from extension!",
    SYNC_ERROR: "Failed to sync jobs from extension.",
    CONNECTION_LOST: "Lost connection to Chrome extension.",
    JOB_SAVED: "Job saved to board!",
    JOB_ALREADY_EXISTS: "Job already exists on your board.",
    LOGIN_REQUIRED: "Please sign in to the web app to save jobs.",
  },

  // Subscription messages
  SUBSCRIPTION: {
    UPGRADE_SUCCESS: "Successfully upgraded to Premium!",
    DOWNGRADE_SUCCESS: "Successfully changed your plan.",
    PAYMENT_SUCCESS: "Payment processed successfully!",
    PAYMENT_ERROR: "Payment failed. Please try again.",
    CANCELLED: "Subscription cancelled successfully.",
    REACTIVATED: "Subscription reactivated successfully!",
  },

  // Generic messages
  GENERIC: {
    LOADING: "Loading...",
    SUCCESS: "Operation completed successfully!",
    ERROR: "Something went wrong. Please try again.",
    NETWORK_ERROR: "Network error. Please check your connection.",
    UNAUTHORIZED: "You don't have permission to perform this action.",
    NOT_FOUND: "The requested resource was not found.",
    SERVER_ERROR: "Server error. Please try again later.",
    VALIDATION_ERROR: "Please check your input and try again.",
    SAVED: "Changes saved successfully!",
    DELETED: "Item deleted successfully!",
    COPIED: "Copied to clipboard!",
    UPDATED: "Updated successfully!",
    CREATED: "Created successfully!",
  },

  // File operations
  FILES: {
    UPLOAD_SUCCESS: "File uploaded successfully!",
    UPLOAD_ERROR: "Failed to upload file. Please check the file format and size.",
    DELETE_SUCCESS: "File deleted successfully!",
    DOWNLOAD_SUCCESS: "File downloaded successfully!",
    EXPORT_SUCCESS: "Data exported successfully!",
    IMPORT_SUCCESS: "Data imported successfully!",
  },

  // Search and filter messages
  SEARCH: {
    NO_RESULTS: "No results found for your search.",
    FILTERS_APPLIED: "Filters applied successfully!",
    FILTERS_CLEARED: "Filters cleared successfully!",
    SEARCH_COMPLETE: "Search complete!",
  },

  // Collaboration messages
  COLLABORATION: {
    INVITED: "Invitation sent successfully!",
    ACCEPTED: "Invitation accepted successfully!",
    DECLINED: "Invitation declined.",
    REMOVED: "Access removed successfully!",
    PERMISSIONS_UPDATED: "Permissions updated successfully!",
  },
} as const;
