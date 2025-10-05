// Security utilities for input validation and sanitization

// HTML sanitization - remove potentially dangerous HTML tags and attributes
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';

  // Remove script tags and their content (avoid dotAll flag for broader TS target compatibility)
  input = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onload, etc.)
  input = input.replace(/\bon\w+="[^"]*"/gi, '');
  input = input.replace(/\bon\w+='[^']*'/gi, '');
  input = input.replace(/\bon\w+=[^>\s]*/gi, '');

  // Remove javascript: URLs
  input = input.replace(/javascript:[^"']*/gi, '');

  // Remove data: URLs that might contain scripts
  input = input.replace(/data:[^;]*;base64,[a-zA-Z0-9+/=]*/gi, '');

  return input.trim();
}

// SQL injection prevention - basic patterns
export function sanitizeForDatabase(input: string): string {
  if (typeof input !== 'string') return '';

  // Remove common SQL injection patterns
  const dangerousPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
    /(-{2}|\/\*|\*\/)/g,
    /('|(\\x27)|(\\x2D))/g,
  ];

  let sanitized = input;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized.trim();
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

// Phone number validation (basic)
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  return phoneRegex.test(cleanPhone);
}

// URL validation
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// File name validation and sanitization
export function sanitizeFileName(filename: string): string {
  if (typeof filename !== 'string') return 'file';

  // Remove path separators and dangerous characters
  return filename
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/^\.+/, '')
    .substring(0, 255); // Limit length
}

// General string sanitization
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove HTML entities
    .substring(0, maxLength);
}

// Validate file upload
export function validateFileUpload(file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
} = {}): { valid: boolean; error?: string } {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options;

  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB` };
  }

  // Check MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}` };
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return { valid: false, error: `File extension is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}` };
    }
  }

  return { valid: true };
}

// Rate limiting helper for API endpoints
export class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  constructor(
    private windowMs: number = 60 * 1000, // 1 minute
    private maxRequests: number = 100
  ) {}

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return false;
    }

    if (record.count >= this.maxRequests) {
      return true;
    }

    record.count++;
    return false;
  }

  getRemainingRequests(identifier: string): number {
    const record = this.requests.get(identifier);
    if (!record) return this.maxRequests;
    return Math.max(0, this.maxRequests - record.count);
  }

  getResetTime(identifier: string): number {
    const record = this.requests.get(identifier);
    return record?.resetTime || 0;
  }

  // Clean up old records periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// XSS prevention - escape HTML entities
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Validate and sanitize user input for forms
export function validateAndSanitizeFormData(data: Record<string, any>): {
  sanitized: Record<string, any>;
  errors: Record<string, string>;
} {
  const sanitized: Record<string, any> = {};
  const errors: Record<string, string> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Sanitize string inputs
      const cleanValue = sanitizeString(value);

      // Validate specific field types
      if (key.toLowerCase().includes('email') && !validateEmail(cleanValue)) {
        errors[key] = 'Invalid email format';
      } else if (key.toLowerCase().includes('phone') && !validatePhone(cleanValue)) {
        errors[key] = 'Invalid phone number format';
      } else if (key.toLowerCase().includes('url') && cleanValue && !validateUrl(cleanValue)) {
        errors[key] = 'Invalid URL format';
      }

      sanitized[key] = cleanValue;
    } else {
      sanitized[key] = value;
    }
  });

  return { sanitized, errors };
}

// Security audit logging
export class SecurityLogger {
  static logSecurityEvent(event: {
    type:
      | 'suspicious_request'
      | 'rate_limit_exceeded'
      | 'invalid_input'
      | 'auth_failure'
      | 'admin_access_denied'
      | 'auth_required';
    ip?: string;
    userId?: string;
    details: Record<string, any>;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...event,
    };

    // In production, this should be sent to a logging service
    console.warn('[SECURITY]', JSON.stringify(logEntry, null, 2));

    // Could integrate with services like:
    // - Datadog
    // - Sentry
    // - CloudWatch
    // - Custom logging service
  }
}
