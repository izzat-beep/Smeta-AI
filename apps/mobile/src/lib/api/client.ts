import { API_BASE_URL } from '@/lib/env';
import { tokenStore } from '@/lib/auth/tokenStore';

// Typed fetch client — web apps/web/src/lib/api.ts naqshi asosida, lekin:
//  - tokenlar expo-secure-store'da (async),
//  - refresh token cookie emas, JSON body'da (G1 backend o'zgarishi),
//  - 'X-Client: mobile' header bilan (backend mobil javobni shu bo'yicha beradi).

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, message: string, code = 'error', details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// 401'da refresh urinilmaydigan yo'llar (cheksiz sikl oldini olish).
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/auth/forgot-password'];

interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

async function parseError(res: Response): Promise<ApiError> {
  let message = `Xatolik (${res.status})`;
  let code = 'error';
  let details: unknown;
  try {
    const data = (await res.json()) as { message?: string; error?: string; details?: unknown };
    if (data.message) message = data.message;
    if (data.error) code = data.error;
    details = data.details;
  } catch {
    /* JSON emas — umumiy xabar qoladi */
  }
  return new ApiError(res.status, message, code, details);
}

async function raw(method: string, path: string, body: unknown, signal?: AbortSignal): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client': 'mobile',
  };
  const access = await tokenStore.getAccess();
  if (access) headers.Authorization = `Bearer ${access}`;
  return fetch(`${API_BASE_URL}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });
}

// Refresh — bir vaqtda bir nechta 401 bo'lsa bitta refresh oqimi ishlaydi.
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const refresh = await tokenStore.getRefresh();
      if (!refresh) return false;
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Client': 'mobile' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { tokens?: { accessToken?: string; refreshToken?: string } };
      if (!data.tokens?.accessToken) return false;
      await tokenStore.set(data.tokens.accessToken, data.tokens.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  let res = await raw(method, path, opts.body, opts.signal);

  if (res.status === 401 && !NO_REFRESH_PATHS.includes(path)) {
    const ok = await tryRefresh();
    if (ok) res = await raw(method, path, opts.body, opts.signal);
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>('GET', path, { signal }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  delete: <T>(path: string, body?: unknown) => request<T>('DELETE', path, { body }),
  tryRefresh,
  baseUrl: API_BASE_URL,
};
