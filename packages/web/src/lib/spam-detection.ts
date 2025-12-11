/**
 * Spam Detection Utility
 * 
 * Multi-layer spam protection for contact forms:
 * - Content analysis (links, spam keywords, patterns)
 * - Rate limiting by IP
 * - Honeypot field detection
 * - Email validation with disposable domain blocking
 */

// Common spam keywords and patterns
const SPAM_KEYWORDS = [
  'viagra', 'cialis', 'casino', 'poker', 'slots', 'lottery',
  'crypto', 'bitcoin', 'nft ', 'forex', 'trading bot',
  'weight loss', 'make money fast', 'work from home opportunity',
  'click here', 'act now', 'limited time offer', 'free money',
  'million dollars', 'congratulations you won', 'claim your prize',
  'nigerian prince', 'wire transfer', 'urgent assistance',
  'seo service', 'backlink', 'link building', 'guest post',
  'buy followers', 'increase traffic', 'rank higher',
];

// Suspicious patterns in messages
const SPAM_PATTERNS = [
  /https?:\/\/[^\s]+\.[^\s]+/gi,  // Multiple URLs
  /\b(http|www)\.[^\s]+/gi,       // URL patterns
  /[A-Z]{10,}/g,                   // All caps words (10+ chars)
  /<[^>]+>/g,                      // HTML tags
  /\[url\]/gi,                     // BBCode
  /[\u4e00-\u9fff]{10,}/g,         // Long Chinese text blocks (often spam)
  /[\u0400-\u04FF]{20,}/g,         // Long Cyrillic text blocks
  /(.)\1{5,}/g,                    // Repeated characters
  /@\w+\.\w+.*@\w+\.\w+/g,         // Multiple emails in one message
];

// Disposable email domains
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail', 'guerrillamail', 'mailinator', '10minutemail', 'throwaway',
  'temp-mail', 'fakeinbox', 'sharklasers', 'getnada', 'maildrop',
  'yopmail', 'trashmail', 'discard', 'spamgourmet', 'mintemail',
  'mailnesia', 'mohmal', 'gemailinator', 'fakemailgenerator', 'tempail',
];

// In-memory rate limiting (per IP)
const submissionTracker = new Map<string, { count: number; firstTime: number; lastTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS_PER_HOUR = 3;

export interface SpamCheckResult {
  isSpam: boolean;
  score: number;
  reasons: string[];
  shouldBlock: boolean;
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
  subject?: string;
  honeypot?: string;
  submittedAt?: number;
  loadedAt?: number;
}

/**
 * Check if a contact form submission is likely spam
 */
export function checkForSpam(
  data: ContactFormData,
  ip: string
): SpamCheckResult {
  const reasons: string[] = [];
  let score = 0;

  // 1. Honeypot check (field should be empty)
  if (data.honeypot && data.honeypot.trim() !== '') {
    score += 100;
    reasons.push('Honeypot field filled');
  }

  // 2. Form submission timing (submitted too fast = bot)
  if (data.loadedAt && data.submittedAt) {
    const fillTime = data.submittedAt - data.loadedAt;
    if (fillTime < 2000) { // Less than 2 seconds
      score += 50;
      reasons.push('Form submitted too quickly');
    } else if (fillTime < 5000) { // Less than 5 seconds
      score += 20;
      reasons.push('Suspiciously fast form completion');
    }
  }

  // 3. Rate limiting by IP
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    score += 80;
    reasons.push(`Rate limit exceeded (${rateCheck.count}/${MAX_SUBMISSIONS_PER_HOUR} in last hour)`);
  }

  // 4. Email validation
  const emailScore = checkEmail(data.email);
  score += emailScore.score;
  reasons.push(...emailScore.reasons);

  // 5. Content analysis
  const contentScore = analyzeContent(data.message, data.subject || '');
  score += contentScore.score;
  reasons.push(...contentScore.reasons);

  // 6. Name validation
  const nameScore = checkName(data.name);
  score += nameScore.score;
  reasons.push(...nameScore.reasons);

  // Determine if spam
  const isSpam = score >= 50;
  const shouldBlock = score >= 80;

  return {
    isSpam,
    score,
    reasons,
    shouldBlock,
  };
}

/**
 * Check rate limit for IP
 */
function checkRateLimit(ip: string): { allowed: boolean; count: number } {
  const now = Date.now();
  const tracker = submissionTracker.get(ip);

  // Cleanup old entries periodically
  if (submissionTracker.size > 1000) {
    for (const [key, value] of submissionTracker.entries()) {
      if (now - value.lastTime > RATE_LIMIT_WINDOW_MS * 2) {
        submissionTracker.delete(key);
      }
    }
  }

  if (!tracker) {
    submissionTracker.set(ip, { count: 1, firstTime: now, lastTime: now });
    return { allowed: true, count: 1 };
  }

  // Reset if window expired
  if (now - tracker.firstTime > RATE_LIMIT_WINDOW_MS) {
    submissionTracker.set(ip, { count: 1, firstTime: now, lastTime: now });
    return { allowed: true, count: 1 };
  }

  // Increment count
  tracker.count++;
  tracker.lastTime = now;
  submissionTracker.set(ip, tracker);

  return {
    allowed: tracker.count <= MAX_SUBMISSIONS_PER_HOUR,
    count: tracker.count,
  };
}

/**
 * Check email for spam indicators
 */
function checkEmail(email: string): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const lowerEmail = email.toLowerCase();

  // Check for disposable email domains
  for (const domain of DISPOSABLE_EMAIL_DOMAINS) {
    if (lowerEmail.includes(domain)) {
      score += 60;
      reasons.push('Disposable email address detected');
      break;
    }
  }

  // Check for suspicious email patterns
  if (/\d{6,}/.test(email)) {
    score += 15;
    reasons.push('Email contains many consecutive numbers');
  }

  if (/[a-z]{20,}@/.test(lowerEmail)) {
    score += 10;
    reasons.push('Unusually long email prefix');
  }

  // Random characters pattern (e.g., "xz8k2l@...")
  if (/^[a-z0-9]{1,3}[0-9]+[a-z0-9]{1,3}@/i.test(email)) {
    score += 25;
    reasons.push('Email looks auto-generated');
  }

  return { score, reasons };
}

/**
 * Analyze message content for spam
 */
function analyzeContent(message: string, subject: string): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const fullText = (subject + ' ' + message).toLowerCase();

  // Check for spam keywords
  const foundKeywords: string[] = [];
  for (const keyword of SPAM_KEYWORDS) {
    if (fullText.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
    }
  }
  if (foundKeywords.length > 0) {
    score += Math.min(foundKeywords.length * 15, 60);
    reasons.push(`Spam keywords detected: ${foundKeywords.slice(0, 3).join(', ')}`);
  }

  // Check for spam patterns
  let urlCount = 0;
  for (const pattern of SPAM_PATTERNS) {
    const matches = message.match(pattern);
    if (matches) {
      if (pattern.toString().includes('http') || pattern.toString().includes('www')) {
        urlCount += matches.length;
      } else {
        score += Math.min(matches.length * 10, 30);
      }
    }
  }

  // URL scoring (1 URL is usually fine, multiple is suspicious)
  if (urlCount > 2) {
    score += 40;
    reasons.push(`Multiple URLs detected (${urlCount})`);
  } else if (urlCount > 0) {
    score += urlCount * 5;
  }

  // Very short message (under 10 chars) is suspicious
  if (message.length < 10) {
    score += 20;
    reasons.push('Message too short');
  }

  // Check for all caps (excluding short words)
  const capsRatio = (message.match(/[A-Z]/g)?.length || 0) / message.length;
  if (capsRatio > 0.7 && message.length > 20) {
    score += 25;
    reasons.push('Excessive capitalization');
  }

  return { score, reasons };
}

/**
 * Check name for spam indicators
 */
function checkName(name: string): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Single character name
  if (name.length <= 1) {
    score += 30;
    reasons.push('Name too short');
  }

  // Name with URLs or email
  if (/https?:\/\/|www\.|@/.test(name)) {
    score += 50;
    reasons.push('Name contains URL or email');
  }

  // Name is all numbers
  if (/^\d+$/.test(name)) {
    score += 40;
    reasons.push('Name is only numbers');
  }

  // Name with special characters
  if (/[<>{}[\]\\|`~]/.test(name)) {
    score += 30;
    reasons.push('Name contains suspicious characters');
  }

  return { score, reasons };
}

/**
 * Record successful submission (for rate tracking)
 */
export function recordSubmission(ip: string): void {
  const now = Date.now();
  const tracker = submissionTracker.get(ip);
  
  if (tracker) {
    tracker.count++;
    tracker.lastTime = now;
  } else {
    submissionTracker.set(ip, { count: 1, firstTime: now, lastTime: now });
  }
}

/**
 * Get statistics for monitoring
 */
export function getSpamStats(): {
  trackedIPs: number;
  blockedCount: number;
} {
  return {
    trackedIPs: submissionTracker.size,
    blockedCount: Array.from(submissionTracker.values())
      .filter(t => t.count > MAX_SUBMISSIONS_PER_HOUR).length,
  };
}
