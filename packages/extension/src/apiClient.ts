import { acquireIdToken, clearCachedAuthToken, getSessionProof, clearSessionProof, setSessionProof, decodeJwtPayload } from './authToken';
import { DEFAULT_WEB_APP_URL, sanitizeBaseUrl } from './constants';
import { checkRateLimit } from './rateLimiter';
import { safeChromeStorageGet } from './utils/safeStorage';
import {
  ApiError,
  API_DEFAULTS,
  RETRYABLE_STATUS_CODES,
  RETRYABLE_ERROR_CODES,
  type ApiRequestOptions,
} from '@hireall/shared';

/**
 * Extension API request options.
 * Extends the shared ApiRequestOptions with extension-specific fields.
 */
export interface ApiOptions extends RequestInit, ApiRequestOptions {
  /** Relative path starting with /api/ */
  path: string;
  /** @deprecated Use retries instead */
  retryCount?: number;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

// Use shared defaults
const DEFAULT_RETRY_COUNT = API_DEFAULTS.retries;
const DEFAULT_RETRY_DELAY = API_DEFAULTS.retryDelay;
const DEFAULT_TIMEOUT = API_DEFAULTS.timeout;
const BACKGROUND_PROXY_TIMEOUT_BUFFER_MS = 2500;
const SESSION_PROOF_REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh proof within 5 minutes of expiry

// Network error codes that should trigger a retry
const RETRYABLE_ERRORS = [...RETRYABLE_ERROR_CODES];

// Request deduplication cache - prevents duplicate concurrent requests
const pendingRequests = new Map<string, Promise<any>>();

// Session proof refresh deduplication - prevents multiple concurrent session refreshes
const pendingProofRefresh = new Map<string, Promise<string | null>>();

function getRequestKey(method: string, url: string, body?: string | null): string {
  // Create a unique key based on method, url, and (for non-GET) a hash of the body
  const bodyHash = body ? body.slice(0, 100) : '';
  return `${method}:${url}:${bodyHash}`;
}

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
  if (status && (RETRYABLE_STATUS_CODES as readonly number[]).includes(status)) {
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

/**
 * Check if we can access tabs API (for getting session proof from web app tab)
 */
function canAccessTabsApi(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.tabs?.query && !!chrome.tabs?.sendMessage;
}

/**
 * Try to get session proof from an active HireAll web app tab.
 * This leverages the existing web app session instead of creating a new one.
 */
async function getSessionProofFromWebAppTab(): Promise<{
  sessionHash: string;
  expiresAt: number;
} | null> {
  if (!canAccessTabsApi()) {
    return null;
  }

  try {
    const tabs = await chrome.tabs.query({
      url: [
        "https://hireall.app/*",
        "https://*.hireall.app/*",
        "http://localhost:3000/*"
      ]
    });

    if (!tabs.length) {
      return null;
    }

    // Try first 2 candidate tabs
    for (const tab of tabs.slice(0, 2)) {
      if (!tab.id) continue;

      const response = await new Promise<any>((resolve) => {
        const timeout = setTimeout(() => resolve(null), 2000);
        chrome.tabs.sendMessage(
          tab.id!,
          { action: 'getSessionProof', target: 'webapp-content' },
          (resp) => {
            clearTimeout(timeout);
            if (chrome.runtime?.lastError || !resp?.success) {
              resolve(null);
              return;
            }
            resolve(resp);
          }
        );
      });

      if (response?.sessionHash) {
        return {
          sessionHash: response.sessionHash,
          expiresAt: response.expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000
        };
      }
    }
  } catch (error) {
    console.debug('Hireall: Failed to get session proof from web app tab', error);
  }

  return null;
}

/**
 * Refresh session proof if needed, with:
 * - Token validation (skip if expired)
 * - Request deduplication (prevent concurrent refreshes)
 * - Web app tab integration (try active tab first)
 */
async function refreshSessionProofIfNeeded(
  token: string,
  baseUrl: string,
  requestId: string
): Promise<string | null> {
  // Validate token before using it for refresh
  const tokenPayload = decodeJwtPayload(token);
  if (!tokenPayload) {
    console.debug('Hireall: Invalid token format, skipping session proof refresh');
    const existing = await getSessionProof();
    return existing?.sessionHash ?? null;
  }

  // Check if token is expired - don't use expired token for refresh
  if (tokenPayload.exp && tokenPayload.exp * 1000 <= Date.now()) {
    console.debug('Hireall: Token expired, skipping session proof refresh');
    const existing = await getSessionProof();
    return existing?.sessionHash ?? null;
  }

  // Create deduplication key based on user and token prefix
  const dedupKey = `${tokenPayload.sub || tokenPayload.user_id || 'unknown'}_${token.slice(0, 20)}`;

  // If refresh is already in progress, return existing promise (prevents race condition)
  if (pendingProofRefresh.has(dedupKey)) {
    console.debug('Hireall: Session proof refresh already in progress, waiting...');
    return pendingProofRefresh.get(dedupKey)!;
  }

  // Wrap the refresh logic in a deduplication promise
  const refreshPromise = (async (): Promise<string | null> => {
    const existing = await getSessionProof();
    const now = Date.now();

    // Return existing if still valid
    if (existing && existing.expiresAt - now > SESSION_PROOF_REFRESH_BUFFER_MS) {
      return existing.sessionHash;
    }

    // Priority 1: Try to get session proof from active web app tab
    const tabProof = await getSessionProofFromWebAppTab();
    if (tabProof) {
      await setSessionProof(tabProof);
      console.debug('Hireall: Got session proof from web app tab');
      return tabProof.sessionHash;
    }

    // Priority 2: Call /api/auth/session directly
    try {
      const res = await fetchWithTimeout(
        `${baseUrl}/api/auth/session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Client-Platform': 'extension',
            'X-Request-ID': requestId,
          },
          credentials: 'include',
          body: JSON.stringify({ idToken: token }),
        },
        12000
      );

      if (!res.ok) {
        return existing?.sessionHash ?? null;
      }

      const payload = await res.json().catch(() => null);
      const sessionHash = payload?.data?.sessionHash || payload?.sessionHash;
      const expiresAt = payload?.data?.expiresAt || payload?.expiresAt || (Date.now() + 7 * 24 * 60 * 60 * 1000);

      if (sessionHash) {
        await setSessionProof({ sessionHash, expiresAt });
        return sessionHash;
      }

      return existing?.sessionHash ?? null;
    } catch (error) {
      console.warn('Hireall: Failed to refresh session proof', error);
      return existing?.sessionHash ?? null;
    }
  })().finally(() => {
    pendingProofRefresh.delete(dedupKey);
  });

  pendingProofRefresh.set(dedupKey, refreshPromise);
  return refreshPromise;
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
            const errorMsg = response?.error || 'Background proxy failed';
            console.warn(`[Hireall] Proxy response not success: ${errorMsg}`, { requestId: params.requestId });
            reject(new Error(errorMsg));
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
    skipAuth,
    retries,
    headers, 
    retryCount = retries ?? DEFAULT_RETRY_COUNT,
    retryDelay = DEFAULT_RETRY_DELAY,
    timeout = DEFAULT_TIMEOUT,
    ...rest 
  } = opts;
  
  const base = await getBaseUrl();
  // skipAuth = false (default) means auth IS required for /api/app/* paths
  // skipAuth = true means skip auth entirely
  const requiresAuth = skipAuth !== true && (skipAuth === false || path.startsWith('/api/app/'));
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

  // Request deduplication for GET requests
  const requestKey = getRequestKey(method, url, rest.body as string | null);
  if (method === 'GET' && pendingRequests.has(requestKey)) {
    console.debug(`[Hireall] Deduplicating request: ${method} ${path}`);
    return pendingRequests.get(requestKey) as Promise<T>;
  }

  // Wrap the actual request execution in a promise for deduplication
  const executeRequest = async (): Promise<T> => {

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
    throw new ApiError({
      message: `Rate limit exceeded for ${rateLimitEndpoint}. Try again in ${retryAfter} seconds.`,
      code: 'RATE_LIMITED',
      status: 429,
      requestId,
      retryAfter,
      details: { rateLimitInfo: rateCheck },
    });
  }

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as any),
  };

  finalHeaders['X-Client-Platform'] = 'extension';

  // Attach a request id for correlating client logs with backend logs (if supported).
  // Backend emits/understands X-Request-ID; keep a single canonical header to avoid CORS allow-list mismatches.
  finalHeaders['X-Request-ID'] = requestId;

  // CSRF protection: Add X-CSRF-Token header if available in storage for state-changing requests
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    try {
      const csrfStorage = await safeChromeStorageGet(
        "local", 
        ["__csrf_token"], 
        { __csrf_token: "" }, 
        "apiClient.csrf"
      );
      if (csrfStorage.__csrf_token) {
        finalHeaders['X-CSRF-Token'] = csrfStorage.__csrf_token;
      }
    } catch (e) {
      console.debug('Hireall: Failed to retrieve CSRF token from storage', e);
    }
  }

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
      throw new ApiError({
        message: 'Authentication required. Please sign in to the extension or web app.',
        code: 'AUTH_REQUIRED',
        status: 401,
        requestId,
      });
    }

    console.debug(`Hireall: Successfully acquired token for ${method} ${path}`, {
      requestId,
      elapsedMs: Date.now() - authStart,
      tokenLength: token.length,
    });

      // Ensure we have a fresh session proof bound to the web session
      const sessionHash = await refreshSessionProofIfNeeded(token, base, requestId);
      if (!sessionHash) {
        // Clear stale auth state for clean recovery
        await clearCachedAuthToken();
        await clearSessionProof();
        
        // Notify user via background script (for popup/badge update)
        try {
          if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
            chrome.runtime.sendMessage({
              type: 'SESSION_PROOF_FAILED',
              payload: {
                requestId,
                path,
                recoveryAction: 'sign_in_required',
                message: 'Your session has expired. Please sign in again to continue.',
              },
            }).catch(() => { /* ignore messaging errors */ });
          }
        } catch {
          // Ignore notification errors
        }
        
        throw new ApiError({
          message: 'Your session has expired. Please sign in again to continue using HireAll.',
          code: 'SESSION_EXPIRED',
          status: 401,
          requestId,
          details: {
            recoveryAction: 'sign_in_required',
            recoveryUrl: `${base}/sign-in`,
          },
        });
      }

    finalHeaders['Authorization'] = `Bearer ${token}`;

    // Attach session proof so the server can bind bearer tokens to a verified session
      finalHeaders['X-Session-Hash'] = sessionHash;
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
            await clearSessionProof();
            break;
          case 403:
            errorMessage = 'Permission denied. You do not have access to this resource.';
            errorCode = 'FORBIDDEN';
            await clearCachedAuthToken();
            await clearSessionProof();
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
        
        throw new ApiError({
          message: errorMessage,
          code: errorCode,
          status,
          requestId,
          details: {
            endpoint: path,
            method,
            serverRequestId,
          },
        });
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
        const parsed = bodyText ? JSON.parse(bodyText) : undefined;
        
        // Unwrap standardized response format { success: true, data: T }
        if (parsed && typeof parsed === 'object' && 'success' in parsed && 'data' in parsed) {
          if (parsed.success === false) {
            throw new ApiError({
              message: parsed.error?.message || 'API request failed',
              code: parsed.error?.code || 'API_ERROR',
              status,
              requestId,
              details: parsed.error?.details,
            });
          }
          return parsed.data as T;
        }
        
        return parsed as T;
      }

      return (useProxy ? resLike!.bodyText : await res!.text()) as any;
      
    } catch (error: any) {
      lastError = error;

      const elapsedMsTotal = Date.now() - requestStart;
      const isAbort = error?.name === 'AbortError';
      const isTypeErrorFetch = error?.name === 'TypeError' && String(error?.message || '').toLowerCase().includes('fetch');

      // Always log failures once with context; retries will add additional debug output.
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[Hireall:API] xx ${method} ${path} failed: ${errorMsg}`, {
        requestId,
        attempt: attempt + 1,
        origin: safeOrigin(url),
        elapsedMsTotal,
        errorName: error?.name,
        errorCode: error?.code,
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
  }; // End of executeRequest function

  // Store promise in deduplication cache for GET requests
  const requestPromise = executeRequest().finally(() => {
    // Clean up the request from the cache when it completes (success or failure)
    pendingRequests.delete(requestKey);
  });

  if (method === 'GET') {
    pendingRequests.set(requestKey, requestPromise);
  }

  return requestPromise;
}

// Convenience wrappers
// NOTE: For backward compatibility, the 'skipAuth' parameter defaults to undefined,
// meaning auth will be auto-detected based on path (included for /api/app/*).
// Pass skipAuth: true to explicitly skip authentication.
export function get<T=any>(path: string, query?: ApiOptions['query'], skipAuth?: boolean, options?: Partial<ApiOptions>) {
  return apiRequest<T>({ path, method: 'GET', query, skipAuth, ...options });
}

export function post<T=any>(path: string, body?: any, skipAuth?: boolean, options?: Partial<ApiOptions>) {
  return apiRequest<T>({ path, method: 'POST', body: body ? JSON.stringify(body) : undefined, skipAuth, ...options });
}

export function put<T=any>(path: string, body?: any, skipAuth?: boolean, options?: Partial<ApiOptions>) {
  return apiRequest<T>({ path, method: 'PUT', body: body ? JSON.stringify(body) : undefined, skipAuth, ...options });
}

export function del<T=any>(path: string, skipAuth?: boolean, options?: Partial<ApiOptions>) {
  return apiRequest<T>({ path, method: 'DELETE', skipAuth, ...options });
}

export function patch<T=any>(path: string, body?: any, skipAuth?: boolean, options?: Partial<ApiOptions>) {
  return apiRequest<T>({ path, method: 'PATCH', body: body ? JSON.stringify(body) : undefined, skipAuth, ...options });
}

/**
 * Upload a file to the API
 * Handles FormData and multipart requests
 */
export async function upload<T=any>(
  path: string,
  file: File,
  additionalData?: Record<string, any>,
  skipAuth?: boolean,
  options?: Partial<ApiOptions>
): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }

  // For FormData, don't set Content-Type header - browser will set it with boundary
  const { headers: customHeaders, ...restOptions } = options || {};
  
  return apiRequest<T>({
    path,
    method: 'POST',
    body: formData,
    skipAuth,
    headers: {
      // Remove Content-Type so browser sets it with boundary
      ...customHeaders,
    },
    ...restOptions,
  });
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
export async function checkHealth(): Promise<ApiHealthStatus> {
  const startTime = Date.now();
  
  try {
    const result = await apiRequest<{
      message: string;
      version: string;
      status: string;
    }>({
      path: '/api/app',
      method: 'GET',
      skipAuth: true,
      retries: 1,
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

/**
 * @deprecated Use checkHealth() instead
 */
export const checkApiHealth = checkHealth;

// Re-export ApiError for convenience
export { ApiError };
