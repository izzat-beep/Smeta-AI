// Markaziy API klienti — access tokenni boshqaradi, /api ga so'rov yuboradi.
// Refresh token endi httpOnly cookie'da (JS ko'ra olmaydi) — shuning uchun
// so'rovlar `credentials: 'include'` bilan yuboriladi va refresh serverda
// cookie orqali rotatsiya qilinadi.
const BASE = import.meta.env.VITE_API_URL ?? '';

const ACCESS = 'smeta_access';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS);
  },
  set(access: string) {
    localStorage.setItem(ACCESS, access);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    // Eski versiyadan qolgan refresh tokenni ham tozalaymiz.
    localStorage.removeItem('smeta_refresh');
  },
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Bu yo'llarda 401 bo'lsa refresh urinilmaydi (aks holda cheksiz sikl / noto'g'ri xatti-harakat).
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/auth/forgot-password'];

async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const access = tokenStore.access;
  if (access) headers.Authorization = `Bearer ${access}`;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include', // refresh cookie'ni yuborish uchun
  });

  // 401 — refresh cookie orqali yangi access olishga urinamiz.
  if (res.status === 401 && retry && !NO_REFRESH_PATHS.includes(path)) {
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
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  // Login-oldi holatida access token bo'lmaganda cookie orqali sessiyani tiklashga urinish.
  tryRefresh,
  baseUrl: BASE,
};
