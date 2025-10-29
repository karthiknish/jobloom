// Security utilities for browser extension

const HTML_TAG_REGEX = /<[^>]*?>/g;
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_REGEX = /on[a-z]+\s*=\s*(['"]).*?\1/gi;
const JS_PROTOCOL_REGEX = /javascript:/gi;
const DATA_HTML_REGEX = /data:text\/html[^\s]*/gi;

const JOB_STRING_FIELDS = [
  'title',
  'company',
  'location',
  'description',
  'url',
  'salary',
  'sponsorshipType',
  'jobType',
  'experienceLevel',
  'companySize',
  'industry',
  'postedDate',
  'applicationDeadline',
  'source',
];

const JOB_BOOLEAN_FIELDS = ['isSponsored', 'remoteWork'];
const JOB_ARRAY_FIELDS = ['skills', 'requirements', 'benefits'];
const JOB_MAX_LENGTHS: Record<string, number> = {
  title: 200,
  company: 100,
  location: 100,
  description: 5000,
  url: 2048,
  salary: 120,
  sponsorshipType: 120,
  jobType: 80,
  experienceLevel: 80,
  companySize: 80,
  industry: 120,
  postedDate: 40,
  applicationDeadline: 40,
  source: 80,
};

type StorageArea = 'sync' | 'local';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function sanitizeString(value: string, maxLength = 10000): string {
  const trimmed = value.slice(0, maxLength * 2);
  const withoutScripts = trimmed.replace(SCRIPT_TAG_REGEX, '');
  const withoutHandlers = withoutScripts.replace(EVENT_HANDLER_REGEX, '');
  const withoutProtocols = withoutHandlers
    .replace(JS_PROTOCOL_REGEX, '')
    .replace(DATA_HTML_REGEX, '');
  const withoutTags = withoutProtocols.replace(HTML_TAG_REGEX, '');
  return withoutTags.trim().slice(0, maxLength);
}

function sanitizeStringArray(values: unknown[], maxLength = 80): string[] {
  return values
    .filter((item): item is string => typeof item === 'string')
    .map((item) => sanitizeString(item, maxLength))
    .filter((item) => item.length > 0)
    .slice(0, 50);
}

function sanitizeSalaryRange(value: unknown): {
  min?: number;
  max?: number;
  currency?: string;
  period?: string;
} | undefined {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const sanitized: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
  } = {};

  if (typeof value.min === 'number' && Number.isFinite(value.min)) {
    sanitized.min = value.min;
  }

  if (typeof value.max === 'number' && Number.isFinite(value.max)) {
    sanitized.max = value.max;
  }

  if (typeof value.currency === 'string') {
    sanitized.currency = sanitizeString(value.currency, 10);
  }

  if (typeof value.period === 'string') {
    sanitized.period = sanitizeString(value.period, 20);
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

// Validate URLs to prevent XSS and other attacks
export function validateUrl(url: string): boolean {
  if (typeof url !== 'string' || url.trim().length === 0) {
    return false;
  }

  try {
    const parsedUrl = new URL(url.trim());
    // Only allow HTTPS URLs
    return parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

// Sanitize job data to prevent injection attacks
export function sanitizeJobData(data: any): Record<string, unknown> {
  if (!isPlainObject(data)) return {};

  const sanitized: Record<string, unknown> = {};

  JOB_STRING_FIELDS.forEach((field) => {
    const value = data[field];
    if (typeof value === 'string' && value.trim().length > 0) {
      const maxLength = JOB_MAX_LENGTHS[field] ?? 1000;
      const cleaned = sanitizeString(value, maxLength);
      if (cleaned.length > 0) {
        if (field === 'url') {
          if (validateUrl(cleaned)) {
            sanitized[field] = cleaned;
          }
        } else {
          sanitized[field] = cleaned;
        }
      }
    }
  });

  JOB_BOOLEAN_FIELDS.forEach((field) => {
    const value = data[field];
    sanitized[field] = typeof value === 'boolean' ? value : false;
  });

  JOB_ARRAY_FIELDS.forEach((field) => {
    const value = data[field];
    if (Array.isArray(value)) {
      const maxLength = field === 'benefits' ? 200 : 120;
      const sanitizedArray = sanitizeStringArray(value, maxLength);
      if (sanitizedArray.length > 0) {
        sanitized[field] = sanitizedArray;
      }
    }
  });

  const salaryRange = sanitizeSalaryRange(data.salaryRange);
  if (salaryRange) {
    sanitized.salaryRange = salaryRange;
  }

  if (typeof data.dateFound === 'string') {
    sanitized.dateFound = sanitizeString(data.dateFound, 40);
  }

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
    'syncAuthState',
    'getUserId',
    'checkSponsorStatus',
    'extractHireallSession',
    'fetchSubscriptionStatus',
    'getAuthToken',
    'acquireAuthToken'
  ];

  if (!allowedActions.includes(message.action)) {
    return false;
  }

  // Restrict unexpected properties
  const allowedKeys = new Set(['action', 'data', 'url', 'requestId', 'userId', 'target', 'token', 'userEmail', 'forceRefresh']);
  if (!Object.keys(message).every((key) => allowedKeys.has(key))) {
    return false;
  }

  switch (message.action) {
    case 'addJob':
    case 'jobAddedToBoard':
      return isPlainObject(message.data);
    case 'openJobUrl':
      return typeof message.url === 'string' && validateUrl(message.url);
    case 'authSuccess': {
      if (message.userId !== undefined && typeof message.userId !== 'string') {
        return false;
      }

      if (message.data !== undefined) {
        if (!isPlainObject(message.data)) {
          return false;
        }

        const { userId, userEmail, token } = message.data as { userId?: unknown; userEmail?: unknown; token?: unknown };
        if (userId !== undefined && typeof userId !== 'string') {
          return false;
        }
        if (userEmail !== undefined && typeof userEmail !== 'string') {
          return false;
        }
        if (token !== undefined && typeof token !== 'string') {
          return false;
        }
      }

      return true;
    }
    case 'syncAuthState':
      if (message.data !== undefined) {
        if (!isPlainObject(message.data)) {
          return false;
        }

        const { userIdOverride, userEmailOverride } = message.data as { userIdOverride?: unknown; userEmailOverride?: unknown };
        if (userIdOverride !== undefined && typeof userIdOverride !== 'string') {
          return false;
        }
        if (userEmailOverride !== undefined && typeof userEmailOverride !== 'string') {
          return false;
        }
      }
      return true;
    case 'acquireAuthToken':
      if (message.forceRefresh !== undefined && typeof message.forceRefresh !== 'boolean') {
        return false;
      }
      return true;
    default:
      return true;
  }
}

// Secure storage wrapper
export class SecureStorage {
  private static getArea(area: StorageArea = 'sync'): chrome.storage.StorageArea {
    return area === 'local' ? chrome.storage.local : chrome.storage.sync;
  }

  static async set(key: string, value: any, options?: { area?: StorageArea }): Promise<void> {
    const storageKey = this.normalizeKey(key);
    const storageArea = this.getArea(options?.area);

    try {
      const data = JSON.stringify(value);
      if (data.length > 7500) {
        throw new Error('Payload too large for secure storage');
      }
      await storageArea.set({ [storageKey]: data });
    } catch (error) {
      console.error('SecureStorage set error:', error);
      throw new Error('Failed to store data securely');
    }
  }

  static async get<T = unknown>(key: string, options?: { area?: StorageArea }): Promise<T | null> {
    const storageKey = this.normalizeKey(key);
    const storageArea = this.getArea(options?.area);

    try {
      const result = await storageArea.get([storageKey]);
      const raw = result[storageKey];
      if (!raw) {
        return null;
      }

      return JSON.parse(raw) as T;
    } catch (error) {
      console.error('SecureStorage get error:', error);
      return null;
    }
  }

  static async remove(key: string, options?: { area?: StorageArea }): Promise<void> {
    const storageKey = this.normalizeKey(key);
    const storageArea = this.getArea(options?.area);

    try {
      await storageArea.remove([storageKey]);
    } catch (error) {
      console.error('SecureStorage remove error:', error);
    }
  }

  private static normalizeKey(key: string): string {
    if (typeof key !== 'string' || key.trim().length === 0) {
      throw new Error('Storage key must be a non-empty string');
    }

    return key.trim();
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

  Object.entries(JOB_MAX_LENGTHS).forEach(([field, maxLength]) => {
    const value = data[field as keyof typeof data];
    if (typeof value === 'string' && value.length > maxLength) {
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
