import { acquireIdToken, clearCachedAuthToken } from './authToken';
import { DEFAULT_WEB_APP_URL, sanitizeBaseUrl } from './constants';
import { checkRateLimit } from './rateLimiter';
import { safeChromeStorageGet } from './utils/safeStorage';

interface ApiOptions extends RequestInit {
  auth?: boolean; // whether to inject bearer token (defaults true for /api/app/*)
  path: string;   // relative path starting with /api/
  query?: Record<string, string | number | boolean | undefined | null>;
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

export async function apiRequest<T = any>(opts: ApiOptions): Promise<T> {
  const { path, query, auth, headers, ...rest } = opts;
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
    throw error;
  }

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as any),
  };

  if (requiresAuth) {
    console.debug(`Hireall: API ${path} requires authentication, attempting to acquire token`);
    let token = await acquireIdToken();
    if (!token) {
      console.debug(`Hireall: First token acquisition failed for ${path}, trying with force refresh`);
      token = await acquireIdToken(true);
    }

    if (!token) {
      console.warn(`Hireall: Authentication failed for ${path} - no token available`);
      throw new Error('Authentication required. Please sign in to the extension.');
    }
    
    console.debug(`Hireall: Successfully acquired token for ${path}`);
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text();
    let errorMessage = `API ${res.status} ${res.statusText}: ${text}`;
    
    // Provide better error messages for common authentication issues
    if (res.status === 401) {
      errorMessage = 'Authentication failed. Please sign in again.';
      await clearCachedAuthToken();
    } else if (res.status === 403) {
      errorMessage = 'Permission denied. You do not have access to this resource.';
      await clearCachedAuthToken();
    } else if (res.status === 429) {
      errorMessage = 'Too many requests. Please try again later.';
    }
    
    const error = new Error(errorMessage);
    (error as any).statusCode = res.status;
    throw error;
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (await res.text()) as any;
}

// Convenience wrappers
export function get<T=any>(path: string, query?: ApiOptions['query'], auth?: boolean) {
  return apiRequest<T>({ path, method: 'GET', query, auth });
}
export function post<T=any>(path: string, body?: any, auth?: boolean) {
  return apiRequest<T>({ path, method: 'POST', body: body ? JSON.stringify(body) : undefined, auth });
}

export function put<T=any>(path: string, body?: any, auth?: boolean) {
  return apiRequest<T>({ path, method: 'PUT', body: body ? JSON.stringify(body) : undefined, auth });
}
