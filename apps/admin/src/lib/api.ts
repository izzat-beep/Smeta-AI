// Admin API klienti — access token localStorage'da, refresh token httpOnly
// cookie'da (JS ko'ra olmaydi). So'rovlar `credentials: 'include'` bilan.
const BASE = import.meta.env.VITE_API_URL ?? '';

const ACCESS = 'smeta_admin_access';

export const tokenStore = {
  get access() { return localStorage.getItem(ACCESS); },
  set(access: string) { localStorage.setItem(ACCESS, access); },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem('smeta_admin_refresh'); // eski versiyadan qolgan
  },
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`;

  const res = await fetch(`${BASE}/api/admin${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (res.status === 401 && retry && !NO_REFRESH_PATHS.includes(path)) {
    const ok = await tryRefresh();
    if (ok) return request<T>(method, path, body, false);
  }

  if (!res.ok) {
    let message = `Xatolik (${res.status})`;
    try {
      const data = await res.json();
      message = data.message ?? message;
    } catch { /* ignore */ }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/admin/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json();
    tokenStore.set(data.tokens.accessToken);
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
  tryRefresh,
};
