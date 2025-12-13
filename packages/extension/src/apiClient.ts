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
const BACKGROUND_PROXY_TIMEOUT_BUFFER_MS = 2500;

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

function createRequestId(): string {
  try {
    const c: any = (globalThis as any).crypto;
    if (c?.randomUUID) return c.randomUUID();
  } catch {
    // ignore
  }

  return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safePreview(text: string, maxLen = 800): string {
  if (!text) return '';
  const trimmed = text.trim();
  return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}…` : trimmed;
}

function safeOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

function shouldProxyApiThroughBackground(): boolean {
  // Content scripts execute in a page context where CORS applies (e.g. linkedin.com).
  // Proxying via the background service worker avoids preflight/CORS failures.
  try {
    if (typeof window === 'undefined') return false;
    if (window.location?.protocol === 'chrome-extension:') return false;
    return typeof chrome !== 'undefined' && !!chrome.runtime?.id && typeof chrome.runtime?.sendMessage === 'function';
  } catch {
    return false;
  }
}

async function proxyFetchViaBackground(params: {
  url: string;
  init: RequestInit;
  timeoutMs: number;
  requestId: string;
}): Promise<{
  status: number;
  statusText: string;
  headers: Record<string, string>;
  contentType: string;
  bodyText: string;
}> {
  const timeoutMs = Math.max(1000, params.timeoutMs + BACKGROUND_PROXY_TIMEOUT_BUFFER_MS);

  console.log(`[Hireall] Proxying API via background`, {
    requestId: params.requestId,
    url: params.url,
    method: params.init.method,
    timeoutMs,
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`Background proxy timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      chrome.runtime.sendMessage(
        {
          action: 'apiProxy',
          target: 'background',
          data: {
            url: params.url,
            method: params.init.method || 'GET',
            headers: params.init.headers || {},
            body: params.init.body,
            timeoutMs: params.timeoutMs,
            requestId: params.requestId,
          },
        },
        (response) => {
          console.log(`[Hireall] Proxy callback invoked`, {
            requestId: params.requestId,
            settled,
            hasResponse: !!response,
            lastError: chrome.runtime?.lastError?.message,
            responseSuccess: response?.success,
            responseStatus: response?.status,
          });

          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);

          if (chrome.runtime?.lastError) {
            console.warn(`[Hireall] Proxy lastError`, { requestId: params.requestId, error: chrome.runtime.lastError.message });
            reject(new Error(chrome.runtime.lastError.message || 'Background proxy failed'));
            return;
          }

          if (!response?.success) {
            console.warn(`[Hireall] Proxy response not success`, { requestId: params.requestId, error: response?.error });
            reject(new Error(response?.error || 'Background proxy failed'));
            return;
          }

          console.log(`[Hireall] Proxy success`, { requestId: params.requestId, status: response.status });
          resolve({
            status: response.status,
            statusText: response.statusText,
            headers: response.headers || {},
            contentType: response.contentType || '',
            bodyText: response.bodyText || '',
          });
        }
      );
    } catch (error) {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      reject(error);
    }
  });
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
  const requestId = createRequestId();
  const method = (rest.method || 'GET').toString().toUpperCase();
  const requestStart = Date.now();
  const useProxy = shouldProxyApiThroughBackground();

  console.log(`[Hireall] API request starting: ${method} ${path}`, {
    requestId,
    useProxy,
    requiresAuth,
    base,
  });

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

  // Attach a request id for correlating client logs with backend logs (if supported).
  finalHeaders['X-HireAll-Request-Id'] = requestId;

  // Acquire auth token if needed
  if (requiresAuth) {
    const authStart = Date.now();
    console.debug(`[Hireall:Auth] Starting auth for ${method} ${path}`, {
      requestId,
      origin: safeOrigin(url),
    });
    let token: string | null = null;
    
    try {
      token = await acquireIdToken();
      if (!token) {
        console.debug(`[Hireall:Auth] First attempt returned null, retrying with force`, {
          requestId,
          elapsedMs: Date.now() - authStart,
        });
        // Wait a bit before retrying with force refresh
        await delay(500);
        token = await acquireIdToken(true);
      }
    } catch (tokenError) {
      console.warn(`Hireall: Token acquisition threw error for ${method} ${path}`, {
        requestId,
        elapsedMs: Date.now() - authStart,
        error: tokenError instanceof Error ? tokenError.message : String(tokenError),
      });
      // One more try after error
      await delay(1000);
      try {
        token = await acquireIdToken(true);
      } catch (retryError) {
        console.error(`Hireall: Token retry also failed`, {
          requestId,
          elapsedMs: Date.now() - authStart,
          error: retryError instanceof Error ? retryError.message : String(retryError),
        });
      }
    }

    if (!token) {
      console.warn(`Hireall: Authentication failed for ${method} ${path} - no token available`, {
        requestId,
        elapsedMs: Date.now() - authStart,
      });
      const error = new Error('Authentication required. Please sign in to the extension or web app.');
      (error as any).code = 'AUTH_REQUIRED';
      (error as any).statusCode = 401;
      throw error;
    }

    console.debug(`Hireall: Successfully acquired token for ${method} ${path}`, {
      requestId,
      elapsedMs: Date.now() - authStart,
      tokenLength: token.length,
    });
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Perform request with retry logic
  let lastError: Error | null = null;

  console.debug(`[Hireall:API] -> ${method} ${path}`, {
    requestId,
    origin: safeOrigin(url),
    requiresAuth,
    retryCount,
    timeoutMs: timeout,
  });
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const attemptStart = Date.now();
      const requestInit: RequestInit = {
        ...rest,
        headers: finalHeaders,
        credentials: 'include',
      };

      const useProxy = shouldProxyApiThroughBackground();
      const resLike = useProxy
        ? await proxyFetchViaBackground({ url, init: requestInit, timeoutMs: timeout, requestId })
        : null;

      const res = !useProxy
        ? await fetchWithTimeout(url, requestInit, timeout)
        : null;

      const attemptElapsedMs = Date.now() - attemptStart;

      const serverRequestId = useProxy
        ? (resLike?.headers?.['x-request-id'] || resLike?.headers?.['x-amzn-requestid'] || undefined)
        : (res!.headers.get('x-request-id') || res!.headers.get('x-amzn-requestid') || undefined);

      // Handle response
      const ok = useProxy ? (resLike!.status >= 200 && resLike!.status < 300) : res!.ok;
      const status = useProxy ? resLike!.status : res!.status;
      const statusText = useProxy ? resLike!.statusText : res!.statusText;
      const contentType = useProxy ? (resLike!.contentType || resLike!.headers?.['content-type'] || '') : (res!.headers.get('content-type') || '');

      if (!ok) {
        const text = useProxy ? resLike!.bodyText : await res!.text();
        const preview = safePreview(text);
        let parsedBody: any = undefined;
        try {
          parsedBody = text ? JSON.parse(text) : undefined;
        } catch {
          // ignore parse errors
        }

        console.warn(`[Hireall:API] !! ${method} ${path} ${status} (${attemptElapsedMs}ms)`, {
          requestId,
          attempt: attempt + 1,
          origin: safeOrigin(url),
          status,
          statusText,
          serverRequestId,
          bodyPreview: preview,
          body: parsedBody,
        });
        
        // Check if we should retry
        if (shouldRetry(null, status) && attempt < retryCount) {
          console.debug(`Hireall: Request to ${path} failed with status ${status}, retrying (attempt ${attempt + 1}/${retryCount})`);
          
          // Use exponential backoff with jitter
          const backoffMs = retryDelay * Math.pow(2, attempt) + Math.random() * 500;
          await delay(backoffMs);
          continue;
        }
        
        // Handle specific error cases
        let errorMessage = `API ${status} ${statusText}: ${text}`;
        let errorCode = 'API_ERROR';
        
        switch (status) {
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
        (error as any).statusCode = status;
        (error as any).code = errorCode;
        (error as any).requestId = requestId;
        (error as any).endpoint = path;
        (error as any).method = method;
        (error as any).serverRequestId = serverRequestId;
        
        // Try to parse error response for more details
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) {
            (error as any).serverError = parsed.error;
          }
          if (parsed.message && typeof parsed.message === 'string') {
            (error as any).serverMessage = parsed.message;
          }
          if (parsed.code) {
            (error as any).code = parsed.code;
          }
        } catch {
          // Ignore parse errors
        }
        
        throw error;
      }

      console.debug(`[Hireall:API] <- ${method} ${path} ${status} (${attemptElapsedMs}ms)`, {
        requestId,
        attempt: attempt + 1,
        serverRequestId,
        elapsedMsTotal: Date.now() - requestStart,
      });
      
      // Success - parse response
      if (contentType.includes('application/json')) {
        const bodyText = useProxy ? resLike!.bodyText : await res!.text();
        return (bodyText ? JSON.parse(bodyText) : undefined) as T;
      }

      return (useProxy ? resLike!.bodyText : await res!.text()) as any;
      
    } catch (error: any) {
      lastError = error;

      const elapsedMsTotal = Date.now() - requestStart;
      const isAbort = error?.name === 'AbortError';
      const isTypeErrorFetch = error?.name === 'TypeError' && String(error?.message || '').toLowerCase().includes('fetch');

      // Always log failures once with context; retries will add additional debug output.
      console.warn(`[Hireall:API] xx ${method} ${path} failed`, {
        requestId,
        attempt: attempt + 1,
        origin: safeOrigin(url),
        elapsedMsTotal,
        errorName: error?.name,
        errorCode: error?.code,
        errorMessage: error instanceof Error ? error.message : String(error),
        aborted: !!isAbort,
        fetchTypeError: !!isTypeErrorFetch,
      });
      
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
