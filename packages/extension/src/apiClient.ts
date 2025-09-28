import { getAuthInstance } from './firebase';
import { DEFAULT_WEB_APP_URL } from './constants';
import { checkRateLimit, RATE_LIMITS } from './rateLimiter';

interface ApiOptions extends RequestInit {
  auth?: boolean; // whether to inject bearer token (defaults true for /api/app/*)
  path: string;   // relative path starting with /api/
  query?: Record<string, string | number | boolean | undefined | null>;
}

export async function getBaseUrl(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['webAppUrl'], (result) => {
      resolve((result.webAppUrl || DEFAULT_WEB_APP_URL).replace(/\/$/, ''));
    });
  });
}

async function getIdToken(): Promise<string | null> {
  try {
    const auth = getAuthInstance();
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
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
  const needsAuth = auth === false ? false : path.startsWith('/api/app/');
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
  const rateCheck = checkRateLimit(rateLimitEndpoint);
  if (!rateCheck.allowed) {
    const error = new Error(
      `Rate limit exceeded for ${rateLimitEndpoint}. Try again in ${Math.ceil(
        (rateCheck.resetIn || 0) / 1000
      )} seconds.`
    );
    (error as any).rateLimitInfo = rateCheck;
    throw error;
  }

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as any),
  };

  if (needsAuth) {
    const token = await getIdToken();
    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
  });

  if (!res.ok) {
    const text = await res.text();
    const error = new Error(`API ${res.status} ${res.statusText}: ${text}`);
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
