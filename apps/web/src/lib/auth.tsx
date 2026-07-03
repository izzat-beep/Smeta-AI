import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Tenant, AuthResponse, LoginRequest, RegisterRequest } from '@smeta/shared';
import { api, tokenStore } from './api';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    // Access token bo'lmasa ham refresh cookie orqali sessiyani tiklashga urinamiz.
    if (!tokenStore.access) {
      const ok = await api.tryRefresh();
      if (!ok) {
        setLoading(false);
        return;
      }
    }
    try {
      const data = await api.get<{ user: User; tenant: Tenant }>('/auth/me');
      setUser(data.user);
      setTenant(data.tenant);
    } catch {
      tokenStore.clear();
      setUser(null);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(data: LoginRequest) {
    const res = await api.post<AuthResponse>('/auth/login', data);
    tokenStore.set(res.tokens.accessToken);
    setUser(res.user);
    setTenant(res.tenant);
  }

  async function register(data: RegisterRequest) {
    const res = await api.post<AuthResponse>('/auth/register', data);
    tokenStore.set(res.tokens.accessToken);
    setUser(res.user);
    setTenant(res.tenant);
  }

  function logout() {
    // Serverda refresh cookie'ni bekor qilamiz (xatolikni e'tiborsiz qoldiramiz).
    api.post('/auth/logout').catch(() => {});
    tokenStore.clear();
    setUser(null);
    setTenant(null);
  }

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  return ctx;
}
