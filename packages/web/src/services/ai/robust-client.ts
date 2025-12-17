/**
 * Robust AI Client
 * 
 * Circuit breaker, retry logic, timeout, caching, rate limiting, and queue for AI calls.
 */

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import { checkServerRateLimit } from '@/lib/rateLimiter';
import type { UserTier } from '@/types/api';
import { aiQueue, AIQueueError, type RequestPriority } from './ai-queue';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY && process.env.NEXT_PUBLIC_GEMINI_API_KEY && process.env.NODE_ENV !== 'production') {
  console.warn('GEMINI_API_KEY is not configured. NEXT_PUBLIC_GEMINI_API_KEY is set but ignored to protect the server key.');
}

let genAI: GoogleGenerativeAI | null = null;
const modelCache = new Map<string, GenerativeModel>();
const DEFAULT_MODEL = 'gemini-2.0-flash';

// ============ CIRCUIT BREAKER ============

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
};

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_MS = 60 * 1000;

function checkCircuitBreaker(): boolean {
  const now = Date.now();
  if (circuitBreaker.isOpen && now - circuitBreaker.lastFailure > CIRCUIT_BREAKER_RESET_MS) {
    circuitBreaker.isOpen = false;
    circuitBreaker.failures = 0;
    console.log('[Gemini] Circuit breaker reset');
  }
  return circuitBreaker.isOpen;
}

function recordFailure(): void {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();
  if (circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.isOpen = true;
    console.warn(`[Gemini] Circuit breaker opened after ${circuitBreaker.failures} failures`);
  }
}

function recordSuccess(): void {
  if (circuitBreaker.failures > 0) {
    circuitBreaker.failures = Math.max(0, circuitBreaker.failures - 1);
  }
}

// ============ RETRY & TIMEOUT ============

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 10000;
const TIMEOUT_MS = 30000;

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

function calculateBackoff(attempt: number): number {
  const exponentialDelay = INITIAL_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, MAX_DELAY_MS);
}

// ============ RESPONSE CACHE ============

const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCacheKey(prompt: string): string {
  return `${prompt.slice(0, 100)}_${prompt.length}`;
}

function getCachedResponse(cacheKey: string): string | null {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('[Gemini] Cache hit');
    return cached.response;
  }
  return null;
}

function cacheResponse(cacheKey: string, response: string): void {
  if (responseCache.size > 100) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(cacheKey, { response, timestamp: Date.now() });
}

// ============ MODEL ACCESS ============

export function getModel(modelName: string = DEFAULT_MODEL): GenerativeModel {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Set GEMINI_API_KEY on the server.');
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }

  const cached = modelCache.get(modelName);
  if (cached) return cached;

  const created = genAI.getGenerativeModel({ model: modelName });
  modelCache.set(modelName, created);
  return created;
}

// ============ ROBUST GENERATION ============

export interface GenerateOptions {
  useCache?: boolean;
  operation?: string;
  /** User ID for rate limiting */
  userId?: string;
  /** User tier for rate limit config */
  userTier?: UserTier;
  /** AI endpoint for rate limiting (e.g., 'ai-generation', 'ai-cover-letter') */
  endpoint?: string;
  /** Request priority in queue */
  priority?: RequestPriority;
  /** Skip queue and execute immediately (use with caution) */
  skipQueue?: boolean;
}

/**
 * Custom error for AI rate limiting
 */
export class AIRateLimitError extends Error {
  constructor(
    public retryAfter: number,
    message?: string
  ) {
    super(message || `AI rate limit exceeded. Please try again in ${retryAfter} seconds.`);
    this.name = 'AIRateLimitError';
  }
}

export async function generateContentRobust(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const { 
    useCache = true, 
    operation = 'AI generation',
    userId = 'anonymous',
    userTier = 'free',
    endpoint = 'ai-generation',
    priority = 'normal',
    skipQueue = false,
  } = options;

  // Check rate limit first
  const rateCheck = checkServerRateLimit(userId, endpoint, undefined, userTier);
  if (!rateCheck.allowed) {
    console.warn(`[Gemini] Rate limit exceeded for ${userId} on ${endpoint}`);
    throw new AIRateLimitError(
      rateCheck.retryAfter || 60,
      `AI rate limit exceeded. You can make ${rateCheck.maxRequests} requests per minute. Try again in ${rateCheck.retryAfter} seconds.`
    );
  }

  if (checkCircuitBreaker()) {
    // Pause queue when circuit breaker is open
    aiQueue.pause();
    throw new Error('AI service temporarily unavailable. Please try again in a moment.');
  } else {
    // Ensure queue is running when circuit breaker is closed
    aiQueue.resume();
  }

  const cacheKey = getCacheKey(prompt);
  if (useCache) {
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
  }

  // Define the actual generation logic
  const executeGeneration = async (): Promise<string> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const model = getModel();
        const result = await withTimeout(
          model.generateContent(prompt),
          TIMEOUT_MS,
          operation
        );

        const response = result.response.text().trim();
        if (!response) throw new Error('Empty response from AI');

        recordSuccess();
        if (useCache) cacheResponse(cacheKey, response);

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[Gemini] Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, lastError.message);

        if (lastError.message.includes('API key') || lastError.message.includes('not configured')) {
          throw lastError;
        }

        // Check for rate limit errors from API
        if (lastError.message.includes('429') || lastError.message.includes('rate limit') || lastError.message.includes('quota')) {
          recordFailure();
          throw new AIRateLimitError(60, 'Gemini API rate limit reached. Please try again later.');
        }

        if (attempt < MAX_RETRIES - 1) {
          const delay = calculateBackoff(attempt);
          console.log(`[Gemini] Retrying in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    recordFailure();
    throw lastError || new Error(`${operation} failed after ${MAX_RETRIES} attempts`);
  };

  // Execute through queue unless skipped
  if (skipQueue) {
    return executeGeneration();
  }

  return aiQueue.enqueue(executeGeneration, priority, userId);
}

// ============ JSON PARSING ============

export function safeParseJSON<T>(text: string, validator?: (data: unknown) => data is T): T | null {
  try {
    const cleaned = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (validator && !validator(parsed)) {
      return null;
    }

    return parsed as T;
  } catch {
    return null;
  }
}
