/**
 * Shared configuration for file upload limits across the application.
 * This file is safe to import on both client and server.
 */

export interface UploadLimits {
  maxSize: number; // in bytes
  maxSizeMB: number; // in MB for display
  allowedTypes: string[];
  allowedExtensions: string[];
  description: string;
}

export const CV_UPLOAD_LIMITS: Record<string, UploadLimits> = {
  // Free plan limits
  free: {
    maxSize: 2 * 1024 * 1024, // 2MB
    maxSizeMB: 2,
    allowedTypes: [
      'application/pdf', 
      'text/plain', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    allowedExtensions: ['pdf', 'txt', 'doc', 'docx'],
    description: 'Free users can upload CVs up to 2MB including Word documents'
  },
  
  // Pro plan limits  
  pro: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxSizeMB: 5,
    allowedTypes: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions: ['pdf', 'txt', 'doc', 'docx'],
    description: 'Pro users can upload CVs up to 5MB including Word documents'
  },
  
  // Premium/Enterprise limits
  premium: {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxSizeMB: 10,
    allowedTypes: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions: ['pdf', 'txt', 'doc', 'docx'],
    description: 'Premium users can upload CVs up to 10MB'
  }
};

// Default limits for unauthenticated or unknown plan users
export const DEFAULT_UPLOAD_LIMITS: UploadLimits = CV_UPLOAD_LIMITS.free;

/**
 * Get upload limits based on user subscription plan
 */
export function getUploadLimitsForPlan(plan: string = 'free'): UploadLimits {
  return CV_UPLOAD_LIMITS[plan] || DEFAULT_UPLOAD_LIMITS;
}
