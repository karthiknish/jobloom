import { acquireIdToken, clearCachedAuthToken } from './authToken';
import { DEFAULT_WEB_APP_URL, sanitizeBaseUrl } from './constants';
import { checkRateLimit } from './rateLimiter';
import { safeChromeStorageGet } from './utils/safeStorage';

interface ApiOptions extends RequestInit {
  auth?: boolean; // whether to inject bearer token (defaults true for /api/app/*)
  path: string;   // relative path starting with /api/
  query?: Record<string, string | number | boolean | undefined | null>;
  retryCount?: number; // number of retries (default: 2)
  retryDelay?: number; // delay between retries in ms (default: 1000)
  timeout?: number; // request timeout in ms (default: 30000)
}

interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

// Retry configuration
const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_RETRY_DELAY = 1000;
const DEFAULT_TIMEOUT = 30000;

// Errors that should trigger a retry
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];
const RETRYABLE_ERRORS = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH', 'ECONNREFUSED'];

export async function getBaseUrl(): Promise<string> {
  const storageValues = await safeChromeStorageGet(
    "sync",
    ["webAppUrl"],
    { webAppUrl: DEFAULT_WEB_APP_URL },
    "apiClient.getBaseUrl"
  );

  const url = typeof storageValues.webAppUrl === "string"
    ? storageValues.webAppUrl
    : DEFAULT_WEB_APP_URL;

  return sanitizeBaseUrl(url);
}

function buildQuery(q?: ApiOptions['query']): string {
  if (!q) return '';
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    params.append(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

function shouldRetry(error: any, status?: number): boolean {
  // Retry on specific status codes
  if (status && RETRYABLE_STATUS_CODES.includes(status)) {
    return true;
  }
  
  // Retry on network errors
  if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
    return true;
  }
  
  // Retry on specific error codes
  if (error?.code && RETRYABLE_ERRORS.includes(error.code)) {
    return true;
  }
  
  // Retry on AbortError (timeout)
  if (error?.name === 'AbortError') {
    return true;
  }
  
  return false;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiRequest<T = any>(opts: ApiOptions): Promise<T> {
  const { 
    path, 
    query, 
    auth, 
    headers, 
    retryCount = DEFAULT_RETRY_COUNT,
    retryDelay = DEFAULT_RETRY_DELAY,
    timeout = DEFAULT_TIMEOUT,
    ...rest 
  } = opts;
  
  const base = await getBaseUrl();
  const requiresAuth = auth === true || (auth === undefined && path.startsWith('/api/app/'));
  const url = `${base}${path}${buildQuery(query)}`;

  // Determine rate limit endpoint based on path
  let rateLimitEndpoint = 'general';
  if (path.includes('/sponsorship/')) {
    rateLimitEndpoint = 'sponsor-lookup';
  } else if (path.includes('/jobs') && opts.method === 'POST') {
    rateLimitEndpoint = 'job-add';
  } else if (path.includes('/users/') && path.includes('/settings')) {
    rateLimitEndpoint = 'user-settings';
  }

  // Check rate limit before making request
  const rateCheck = await checkRateLimit(rateLimitEndpoint);
  if (!rateCheck.allowed) {
    const retryAfter = rateCheck.retryAfter || Math.ceil((rateCheck.resetIn || 0) / 1000);
    const error = new Error(
      `Rate limit exceeded for ${rateLimitEndpoint}. Try again in ${retryAfter} seconds.`
    );
    (error as any).rateLimitInfo = rateCheck;
    (error as any).retryAfter = retryAfter;
    (error as any).code = 'RATE_LIMITED';
    throw error;
  }

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as any),
  };

  // Acquire auth token if needed
  if (requiresAuth) {
    console.debug(`Hireall: API ${path} requires authentication, attempting to acquire token`);
    let token: string | null = null;
    
    try {
      token = await acquireIdToken();
      if (!token) {
        console.debug(`Hireall: First token acquisition failed for ${path}, trying with force refresh`);
        // Wait a bit before retrying with force refresh
        await delay(500);
        token = await acquireIdToken(true);
      }
    } catch (tokenError) {
      console.warn(`Hireall: Token acquisition threw error for ${path}:`, tokenError);
      // One more try after error
      await delay(1000);
      try {
        token = await acquireIdToken(true);
      } catch (retryError) {
        console.error(`Hireall: Token retry also failed:`, retryError);
      }
    }

    if (!token) {
      console.warn(`Hireall: Authentication failed for ${path} - no token available`);
      const error = new Error('Authentication required. Please sign in to the extension or web app.');
      (error as any).code = 'AUTH_REQUIRED';
      (error as any).statusCode = 401;
      throw error;
    }
    
    console.debug(`Hireall: Successfully acquired token for ${path} (length: ${token.length})`);
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Perform request with retry logic
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const res = await fetchWithTimeout(url, {
        ...rest,
        headers: finalHeaders,
        credentials: 'include',
      }, timeout);

      // Handle response
      if (!res.ok) {
        const text = await res.text();
        
        // Check if we should retry
        if (shouldRetry(null, res.status) && attempt < retryCount) {
          console.debug(`Hireall: Request to ${path} failed with status ${res.status}, retrying (attempt ${attempt + 1}/${retryCount})`);
          
          // Use exponential backoff with jitter
          const backoffMs = retryDelay * Math.pow(2, attempt) + Math.random() * 500;
          await delay(backoffMs);
          continue;
        }
        
        // Handle specific error cases
        let errorMessage = `API ${res.status} ${res.statusText}: ${text}`;
        let errorCode = 'API_ERROR';
        
        switch (res.status) {
          case 401:
            errorMessage = 'Authentication failed. Please sign in again.';
            errorCode = 'AUTH_FAILED';
            await clearCachedAuthToken();
            break;
          case 403:
            errorMessage = 'Permission denied. You do not have access to this resource.';
            errorCode = 'FORBIDDEN';
            await clearCachedAuthToken();
            break;
          case 404:
            errorMessage = 'The requested resource was not found.';
            errorCode = 'NOT_FOUND';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            errorCode = 'RATE_LIMITED';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            errorCode = 'SERVER_ERROR';
            break;
          case 503:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            errorCode = 'SERVICE_UNAVAILABLE';
            break;
        }
        
        const error = new Error(errorMessage);
        (error as any).statusCode = res.status;
        (error as any).code = errorCode;
        
        // Try to parse error response for more details
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) {
            (error as any).serverError = parsed.error;
          }
          if (parsed.code) {
            (error as any).code = parsed.code;
          }
        } catch {
          // Ignore parse errors
        }
        
        throw error;
      }
      
      // Success - parse response
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        return (await res.json()) as T;
      }
      return (await res.text()) as any;
      
    } catch (error: any) {
      lastError = error;
      
      // Check if we should retry on network errors
      if (shouldRetry(error) && attempt < retryCount) {
        console.debug(`Hireall: Request to ${path} failed with error "${error.message}", retrying (attempt ${attempt + 1}/${retryCount})`);
        
        // Use exponential backoff with jitter
        const backoffMs = retryDelay * Math.pow(2, attempt) + Math.random() * 500;
        await delay(backoffMs);
        continue;
      }
      
      // Don't retry - throw the error
      throw error;
    }
  }
  
  // Should not reach here, but just in case
  throw lastError || new Error('Request failed after all retries');
}

// Convenience wrappers
export function get<T=any>(path: string, query?: ApiOptions['query'], auth?: boolean, options?: Partial<ApiOptions>) {
  return apiRequest<T>({ path, method: 'GET', query, auth, ...options });
}

export function post<T=any>(path: string, body?: any, auth?: boolean, options?: Partial<ApiOptions>) {
  return apiRequest<T>({ path, method: 'POST', body: body ? JSON.stringify(body) : undefined, auth, ...options });
}

export function put<T=any>(path: string, body?: any, auth?: boolean, options?: Partial<ApiOptions>) {
  return apiRequest<T>({ path, method: 'PUT', body: body ? JSON.stringify(body) : undefined, auth, ...options });
}

export function del<T=any>(path: string, auth?: boolean, options?: Partial<ApiOptions>) {
  return apiRequest<T>({ path, method: 'DELETE', auth, ...options });
}

export function patch<T=any>(path: string, body?: any, auth?: boolean, options?: Partial<ApiOptions>) {
  return apiRequest<T>({ path, method: 'PATCH', body: body ? JSON.stringify(body) : undefined, auth, ...options });
}

/**
 * Health check status response
 */
export interface ApiHealthStatus {
  healthy: boolean;
  latencyMs: number;
  version?: string;
  error?: string;
}

/**
 * Health check for the API
 */
export async function checkApiHealth(): Promise<ApiHealthStatus> {
  const startTime = Date.now();
  
  try {
    const result = await apiRequest<{
      message: string;
      version: string;
      status: string;
    }>({
      path: '/api/app',
      method: 'GET',
      auth: false,
      retryCount: 1,
      timeout: 10000 // 10 second timeout for health check
    });
    
    return {
      healthy: result.status === 'healthy',
      latencyMs: Date.now() - startTime,
      version: result.version
    };
  } catch (error: any) {
    return {
      healthy: false,
      latencyMs: Date.now() - startTime,
      error: error.message || 'Unknown error'
    };
  }
}
