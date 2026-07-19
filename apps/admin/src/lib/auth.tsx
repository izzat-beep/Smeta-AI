import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AdminUser, Vendor } from '@smeta/shared';
import { api, tokenStore } from './api';

type Role = 'SUPERADMIN' | 'SUPPORT' | 'VENDOR';

interface MeResponse {
  role: Role;
  admin?: AdminUser;
  vendor?: Vendor;
  mustChangePassword?: boolean;
  tokens?: { accessToken: string };
  twoFactorRequired?: boolean;
}

interface AdminAuthState {
  role: Role | null;
  admin: AdminUser | null;
  vendor: Vendor | null;
  mustChangePassword: boolean;
  loading: boolean;
  isVendor: boolean;
  isSuperadmin: boolean;
  login: (login: string, password: string, code?: string) => Promise<{ twoFactorRequired?: boolean }>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const Ctx = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [mustChangePassword, setMcp] = useState(false);
  const [loading, setLoading] = useState(true);

  function apply(data: MeResponse) {
    setRole(data.role);
    setAdmin(data.admin ?? null);
    setVendor(data.vendor ?? null);
    setMcp(!!data.mustChangePassword);
  }

  async function refreshMe() {
    try {
      const data = await api.get<MeResponse>('/me');
      apply(data);
    } catch {
      tokenStore.clear();
      setRole(null); setAdmin(null); setVendor(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      if (!tokenStore.access) {
        const ok = await api.tryRefresh();
        if (!ok) { setLoading(false); return; }
      }
      await refreshMe();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(loginId: string, password: string, code?: string) {
    const res = await api.post<MeResponse>('/auth/login', {
      email: loginId,
      login: loginId,
      password,
      ...(code ? { code } : {}),
    });
    // 2FA yoqilgan — server kod so'ramoqda. Token berilmagan, holat o'zgarmaydi.
    if (res.twoFactorRequired) return { twoFactorRequired: true };
    if (res.tokens) tokenStore.set(res.tokens.accessToken);
    apply(res);
    return {};
  }

  function logout() {
    api.post('/auth/logout').catch(() => {});
    tokenStore.clear();
    setRole(null); setAdmin(null); setVendor(null); setMcp(false);
  }

  return (
    <Ctx.Provider value={{ role, admin, vendor, mustChangePassword, loading, isVendor: role === 'VENDOR', isSuperadmin: role === 'SUPERADMIN', login, logout, refreshMe }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAdminAuth provider ichida');
  return ctx;
}
