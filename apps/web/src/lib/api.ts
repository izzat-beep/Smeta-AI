// Markaziy API klienti — JWT tokenlarni boshqaradi, /api ga so'rov yuboradi.
const BASE = import.meta.env.VITE_API_URL ?? '';

const ACCESS = 'smeta_access';
const REFRESH = 'smeta_refresh';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS);
  },
  get refresh() {
    return localStorage.getItem(REFRESH);
  },
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS, access);
    if (refresh) localStorage.setItem(REFRESH, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const access = tokenStore.access;
  if (access) headers.Authorization = `Bearer ${access}`;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 401 — refresh urinib ko'ramiz
  if (res.status === 401 && retry && tokenStore.refresh && path !== '/auth/refresh') {
    const ok = await tryRefresh();
    if (ok) return request<T>(method, path, body, false);
  }

  if (!res.ok) {
    let message = `Xatolik (${res.status})`;
    try {
      const data = await res.json();
      message = data.message ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokenStore.refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    tokenStore.set(data.tokens.accessToken, data.tokens.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  baseUrl: BASE,
};
