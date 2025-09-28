// Security utilities for browser extension

// Validate URLs to prevent XSS and other attacks
export function validateUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Only allow HTTPS URLs
    return parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

// Sanitize job data to prevent injection attacks
export function sanitizeJobData(data: any): any {
  if (!data || typeof data !== 'object') return {};

  const sanitized = { ...data };

  // Sanitize string fields
  const stringFields = ['title', 'company', 'location', 'description', 'url'];
  stringFields.forEach(field => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitized[field]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .substring(0, 10000); // Limit length
    }
  });

  return sanitized;
}

// Validate message format for extension communication
export function validateMessage(message: any): boolean {
  if (!message || typeof message !== 'object') return false;

  // Check for required action field
  if (!message.action || typeof message.action !== 'string') return false;

  // Define allowed actions
  const allowedActions = [
    'addJob',
    'jobAddedToBoard',
    'getWebAppUrl',
    'openJobUrl',
    'authSuccess',
    'getUserId',
    'checkSponsorStatus'
  ];

  return allowedActions.includes(message.action);
}

// Secure storage wrapper
export class SecureStorage {
  static async set(key: string, value: any): Promise<void> {
    try {
      const data = JSON.stringify(value);
      await chrome.storage.sync.set({ [key]: data });
    } catch (error) {
      console.error('SecureStorage set error:', error);
      throw new Error('Failed to store data securely');
    }
  }

  static async get(key: string): Promise<any> {
    try {
      const result = await chrome.storage.sync.get([key]);
      const data = result[key];
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('SecureStorage get error:', error);
      return null;
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      await chrome.storage.sync.remove([key]);
    } catch (error) {
      console.error('SecureStorage remove error:', error);
    }
  }
}

// Rate limiting for extension operations
export class ExtensionRateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();

  constructor(
    private windowMs: number = 60000, // 1 minute
    private maxAttempts: number = 10
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (record.count >= this.maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  // Clean up old records
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (now > record.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

// Input validation for job data
export function validateJobData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data) {
    errors.push('Job data is required');
    return { valid: false, errors };
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Job title is required and must be a string');
  }

  if (!data.company || typeof data.company !== 'string' || data.company.trim().length === 0) {
    errors.push('Company name is required and must be a string');
  }

  if (data.url && !validateUrl(data.url)) {
    errors.push('Job URL must be a valid HTTPS URL');
  }

  // Limit field lengths
  const maxLengths = {
    title: 200,
    company: 100,
    location: 100,
    description: 5000
  };

  Object.entries(maxLengths).forEach(([field, maxLength]) => {
    if (data[field] && data[field].length > maxLength) {
      errors.push(`${field} exceeds maximum length of ${maxLength} characters`);
    }
  });

  return { valid: errors.length === 0, errors };
}

// Security audit logging for extension
export class ExtensionSecurityLogger {
  static log(message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      data: data ? JSON.stringify(data) : undefined
    };

    // In production, this would send to a logging service
    console.log('[EXTENSION SECURITY]', logEntry);
  }

  static logSuspiciousActivity(activity: string, details?: any): void {
    this.log(`Suspicious activity: ${activity}`, details);
  }

  static logValidationFailure(field: string, value: any): void {
    this.log(`Validation failure for ${field}`, { field, value: String(value).substring(0, 100) });
  }
}
