import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AdminUser, AdminAuthResponse } from '@smeta/shared';
import { api, tokenStore } from './api';

interface AdminAuthState {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Access token bo'lmasa refresh cookie orqali sessiyani tiklashga urinamiz.
      if (!tokenStore.access) {
        const ok = await api.tryRefresh();
        if (!ok) { setLoading(false); return; }
      }
      try {
        const data = await api.get<{ admin: AdminUser }>('/me');
        setAdmin(data.admin);
      } catch {
        tokenStore.clear();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<AdminAuthResponse>('/auth/login', { email, password });
    tokenStore.set(res.tokens.accessToken);
    setAdmin(res.admin);
  }

  function logout() {
    api.post('/auth/logout').catch(() => {});
    tokenStore.clear();
    setAdmin(null);
  }

  return <Ctx.Provider value={{ admin, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAdminAuth provider ichida');
  return ctx;
}
