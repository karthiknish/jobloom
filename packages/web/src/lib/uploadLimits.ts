/**
 * Shared upload limits configuration
 * Centralized configuration for file upload limits across the application
 */

export interface UploadLimitConfig {
  maxSizeBytes: number;
  maxSizeMB: number;
  allowedTypes: string[];
  allowedExtensions: string[];
  description: string;
}

/**
 * Upload limits for different features
 */
export const UPLOAD_LIMITS = {
  /**
   * CV Analysis - smaller limit for AI processing
   * Free users: 2MB, Premium users may get higher limits from API
   */
  CV_ANALYSIS: {
    maxSizeBytes: 2 * 1024 * 1024,
    maxSizeMB: 2,
    allowedTypes: ['application/pdf', 'text/plain'],
    allowedExtensions: ['pdf', 'txt'],
    description: 'Resume files for AI analysis (2MB limit)'
  } as UploadLimitConfig,

  /**
   * Resume Import - larger limit for parsing flexibility
   * Supports more file types for broader compatibility
   */
  RESUME_IMPORT: {
    maxSizeBytes: 10 * 1024 * 1024,
    maxSizeMB: 10,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    allowedExtensions: ['pdf', 'doc', 'docx', 'txt'],
    description: 'Resume files for import and parsing (10MB limit)'
  } as UploadLimitConfig,
} as const;

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate file against upload limits
 */
export function validateFileUpload(
  file: File, 
  limits: UploadLimitConfig
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > limits.maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${limits.maxSizeMB}MB limit`
    };
  }

  // Check file type
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!limits.allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file type. Allowed: ${limits.allowedExtensions.join(', ')}`
    };
  }

  return { valid: true };
}
