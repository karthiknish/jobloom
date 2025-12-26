/**
 * Error Message Humanizer
 * Converts technical API errors into user-friendly messages
 */

interface ErrorPattern {
  pattern: RegExp | string;
  message: string;
  suggestion?: string;
}

// Common error patterns and their friendly messages
const errorPatterns: ErrorPattern[] = [
  // Network errors
  { pattern: /network/i, message: "Connection issue. Please check your internet and try again.", suggestion: "Check your WiFi or mobile data connection, then refresh the page." },
  { pattern: /fetch failed/i, message: "Couldn't connect to the server. Please try again.", suggestion: "Wait a moment and try again. If the problem persists, check your internet connection." },
  { pattern: /timeout/i, message: "The request took too long. Please try again.", suggestion: "Your connection may be slow. Try again or switch to a faster network." },
  { pattern: /ECONNREFUSED/i, message: "Server is temporarily unavailable. Please try again later.", suggestion: "Our servers might be undergoing maintenance. Please try again in a few minutes." },
  
  // Auth errors
  { pattern: /unauthorized/i, message: "Please sign in to continue.", suggestion: "Your session may have expired. Sign in again to continue." },
  { pattern: /forbidden/i, message: "You don't have permission to do this.", suggestion: "This action requires additional permissions. Contact support if you believe this is an error." },
  { pattern: /auth.*expired/i, message: "Your session has expired. Please sign in again.", suggestion: "For security, sessions expire after a period of inactivity. Simply sign in again." },
  { pattern: /invalid.*token/i, message: "Your session is invalid. Please sign in again.", suggestion: "Clear your browser cache and sign in again." },
  
  // Validation errors
  { pattern: /validation/i, message: "Please check your input and try again.", suggestion: "Review the highlighted fields for any errors." },
  { pattern: /required/i, message: "Please fill in all required fields.", suggestion: "Look for fields marked with an asterisk (*) that need your input." },
  { pattern: /invalid.*email/i, message: "Please enter a valid email address.", suggestion: "Make sure your email follows the format: example@domain.com" },
  { pattern: /invalid.*password/i, message: "Password doesn't meet requirements.", suggestion: "Use at least 8 characters with a mix of letters and numbers." },
  
  // Rate limiting
  { pattern: /rate.*limit/i, message: "Too many requests. Please wait a moment and try again.", suggestion: "Wait 30 seconds before trying again." },
  { pattern: /too many/i, message: "Too many requests. Please wait a moment and try again.", suggestion: "Take a short break and try again in about 30 seconds." },
  { pattern: /429/i, message: "You're doing that too fast. Please slow down.", suggestion: "Wait a minute before making more requests." },
  
  // Server errors
  { pattern: /500|internal.*error/i, message: "Something went wrong on our end. Please try again.", suggestion: "This is our fault, not yours. Try again, and if the problem continues, contact support." },
  { pattern: /502|bad.*gateway/i, message: "Server is temporarily busy. Please try again.", suggestion: "Our servers are experiencing high traffic. Please wait a moment and try again." },
  { pattern: /503|unavailable/i, message: "Service is temporarily unavailable. Please try again later.", suggestion: "We're doing maintenance or experiencing issues. Check back in a few minutes." },
  { pattern: /504|gateway.*timeout/i, message: "Server took too long to respond. Please try again.", suggestion: "Try refreshing the page. If the issue persists, try again later." },
  
  // Resource errors
  { pattern: /not.*found|404/i, message: "The item you're looking for couldn't be found.", suggestion: "It may have been moved or deleted. Check the URL or navigate from the menu." },
  { pattern: /already.*exists/i, message: "This item already exists.", suggestion: "Try using a different name or updating the existing item instead." },
  { pattern: /duplicate/i, message: "This item already exists.", suggestion: "Check if you've already created this item, or use a different name." },
  { pattern: /conflict/i, message: "This conflicts with existing data. Please refresh and try again.", suggestion: "Someone else may have made changes. Refresh to see the latest version." },
  
  // File errors
  { pattern: /file.*too.*large/i, message: "File is too large. Please use a smaller file.", suggestion: "Reduce the file size to under 10MB. Try compressing images or using a different format." },
  { pattern: /invalid.*file/i, message: "This file type isn't supported.", suggestion: "Supported formats: PDF, DOC, DOCX, TXT. Save your file in one of these formats." },
  { pattern: /upload.*failed/i, message: "File upload failed. Please try again.", suggestion: "Check your file and internet connection, then try uploading again." },
  
  // Quota errors
  { pattern: /quota|limit.*reached/i, message: "You've reached your limit. Consider upgrading your plan.", suggestion: "Upgrade to Premium for unlimited access, or wait for your limit to reset." },
  { pattern: /storage.*full/i, message: "Storage is full. Please free up space.", suggestion: "Delete unused items or upgrade your storage plan." },
];

// Action-specific friendly messages
const actionMessages: Record<string, { success: string; error: string }> = {
  save: {
    success: "Changes saved successfully!",
    error: "We couldn't save your changes. Please try again.",
  },
  delete: {
    success: "Deleted successfully!",
    error: "We couldn't delete this item. Please try again.",
  },
  update: {
    success: "Updated successfully!",
    error: "We couldn't update this. Please try again.",
  },
  create: {
    success: "Created successfully!",
    error: "We couldn't create this. Please try again.",
  },
  load: {
    success: "Loaded successfully!",
    error: "We couldn't load this data. Please refresh the page.",
  },
  upload: {
    success: "Uploaded successfully!",
    error: "Upload failed. Please try again.",
  },
  export: {
    success: "Export complete!",
    error: "Export failed. Please try again.",
  },
  import: {
    success: "Import complete!",
    error: "Import failed. Please check your file and try again.",
  },
  send: {
    success: "Sent successfully!",
    error: "We couldn't send this. Please try again.",
  },
};

/**
 * Humanizes a technical error message
 * @param error - The error object or message
 * @param action - Optional action context (e.g., 'save', 'delete')
 * @returns User-friendly error message
 */
export function humanizeError(
  error: unknown,
  action?: keyof typeof actionMessages
): string {
  // Extract error message
  let errorMessage = "";
  
  if (typeof error === "string") {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error && typeof error === "object") {
    const errObj = error as Record<string, unknown>;
    errorMessage = String(errObj.message || errObj.error || errObj.detail || "");
  }
  
  // Check for pattern matches
  for (const { pattern, message } of errorPatterns) {
    if (typeof pattern === "string") {
      if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
        return message;
      }
    } else if (pattern.test(errorMessage)) {
      return message;
    }
  }
  
  // Use action-specific fallback if provided
  if (action && actionMessages[action]) {
    return actionMessages[action].error;
  }
  
  // Generic fallback
  return "Something went wrong. Please try again.";
}

/**
 * Gets a success message for an action
 * @param action - The action that succeeded
 * @returns User-friendly success message
 */
export function getSuccessMessage(action: keyof typeof actionMessages): string {
  return actionMessages[action]?.success || "Success!";
}

/**
 * Wraps an async function to humanize any errors
 * @param fn - Async function to wrap
 * @param action - Action context for error messages
 * @returns Wrapped function that throws humanized errors
 */
export function withHumanizedErrors<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  action?: keyof typeof actionMessages
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw new Error(humanizeError(error, action));
    }
  }) as T;
}

export { actionMessages };
