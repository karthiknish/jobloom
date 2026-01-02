/**
 * Production security utilities and configurations
 */

export const securityConfig = {
  // Rate limiting configurations
  rateLimits: {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 auth requests per windowMs
      message: 'Too many authentication attempts, please try again later.',
      skipSuccessfulRequests: true,
    },
    sensitive: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // limit each IP to 10 sensitive requests per hour
      message: 'Too many sensitive operations, please try again later.',
    },
  },

  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://*.firebase.com",
        "https://*.googleapis.com",
        "https://*.googletagmanager.com",
        "https://apis.google.com",
        "https://accounts.google.com",
        "https://*.stripe.com",
        "https://us.i.posthog.com",
        "https://us-assets.i.posthog.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:",
        "https://us.i.posthog.com",
        "https://us-assets.i.posthog.com",
      ],
      connectSrc: [
        "'self'",
        "https://*.firebase.com",
        "https://*.googleapis.com",
        "https://*.stripe.com",
        "https://www.google-analytics.com",
        "https://www.googletagmanager.com",
        "https://accounts.google.com",
        "https://*.google.com",
        "https://*.gstatic.com",
        "https://*.googleusercontent.com",
        "https://us.i.posthog.com",
        "https://us-assets.i.posthog.com",
        "https://app.posthog.com",
        "wss://*.firebaseio.com",
      ],
      frameSrc: [
        "'self'",
        "https://*.stripe.com",
        "https://*.firebase.com",
        "https://auth.hireall.app",
        "https://*.hireall.app",
        "https://accounts.google.com",
        "https://*.google.com",
        "https://*.googleusercontent.com",
        "https://*.gstatic.com",
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },

  // Security headers
  securityHeaders: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Cross-Origin-Opener-Policy': 'unsafe-none',
  },
};

/**
 * Validate environment variables are set in production
 */
export function validateEnvironmentVariables(): void {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Check if the current environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Log security events (in production, this should go to a security monitoring service)
 */
export function logSecurityEvent(event: string, details: any = {}): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    ip: details.ip || 'unknown',
  };

  if (isProduction()) {
    // Log security events in production
    console.warn('Security Event:', logEntry);
  } else {
    console.log('Security Event (Development):', logEntry);
  }
}
