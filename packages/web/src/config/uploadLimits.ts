/**
 * Configuration for file upload limits across the application
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
    allowedTypes: ['application/pdf', 'text/plain'],
    allowedExtensions: ['pdf', 'txt'],
    description: 'Free users can upload CVs up to 2MB'
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

/**
 * Get upload limits for a user based on their subscription
 */
export async function getUploadLimitsForUser(userId: string): Promise<UploadLimits> {
  try {
    // This would typically check the user's subscription in the database
    // For now, we'll return a basic implementation
    const { getAdminDb } = await import('@/firebase/admin');
    const db = getAdminDb();
    
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    let plan = 'free';
    if (userData?.subscriptionId) {
      const subscriptionDoc = await db.collection('subscriptions').doc(userData.subscriptionId).get();
      const subscription = subscriptionDoc.data();
      
      if (subscription?.status === 'active' && subscription?.plan) {
        plan = subscription.plan;
      }
    }
    
    return getUploadLimitsForPlan(plan);
  } catch (error) {
    console.error('Error getting upload limits for user:', error);
    return DEFAULT_UPLOAD_LIMITS;
  }
}

/**
 * Validate file against upload limits with detailed error messages
 */
export function validateFileUploadWithLimits(file: File, limits: UploadLimits): {
  valid: boolean;
  error?: string;
  errorType?: 'size' | 'type' | 'extension';
  details?: {
    actualSize: number;
    maxSize: number;
    maxSizeMB: number;
    actualType: string;
    actualExtension: string;
  };
} {
  const { maxSize, allowedTypes, allowedExtensions } = limits;
  
  // Check file size
  if (file.size > maxSize) {
    const actualSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size ${actualSizeMB}MB exceeds maximum allowed size of ${limits.maxSizeMB}MB`,
      errorType: 'size',
      details: {
        actualSize: file.size,
        maxSize,
        maxSizeMB: limits.maxSizeMB,
        actualType: file.type,
        actualExtension: file.name.split('.').pop()?.toLowerCase() || ''
      }
    };
  }
  
  // Check MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      errorType: 'type',
      details: {
        actualSize: file.size,
        maxSize,
        maxSizeMB: limits.maxSizeMB,
        actualType: file.type,
        actualExtension: file.name.split('.').pop()?.toLowerCase() || ''
      }
    };
  }
  
  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension ".${extension}" is not allowed. Allowed extensions: .${allowedExtensions.join(', .')}`,
        errorType: 'extension',
        details: {
          actualSize: file.size,
          maxSize,
          maxSizeMB: limits.maxSizeMB,
          actualType: file.type,
          actualExtension: extension || ''
        }
      };
    }
  }
  
  return { valid: true };
}

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
