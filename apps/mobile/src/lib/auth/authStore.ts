import { create } from 'zustand';
import type { User, Tenant } from '@smeta/shared';
import { api } from '@/lib/api/client';
import { tokenStore } from '@/lib/auth/tokenStore';
import { unregisterPush } from '@/lib/push';

// Mobil login/register javobi — web AuthResponse + mobil uchun refreshToken (G1).
interface MobileAuthResponse {
  user: User;
  tenant: Tenant;
  tokens: { accessToken: string; refreshToken?: string };
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isOwner: boolean;
  bootstrap: () => Promise<void>;
  refreshMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  forgotPassword: (input: ForgotInput) => Promise<void>;
  logout: () => Promise<void>;
}

export interface ForgotInput {
  email: string;
  phone: string;
  newPassword: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  phone?: string;
}

function applyTokens(res: MobileAuthResponse): Promise<void> {
  return tokenStore.set(res.tokens.accessToken, res.tokens.refreshToken);
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  status: 'loading',
  isOwner: false,

  // Ilova ochilganda — saqlangan token bilan sessiyani tiklashga urinish.
  async bootstrap() {
    const access = await tokenStore.getAccess();
    if (!access) {
      const ok = await api.tryRefresh();
      if (!ok) {
        set({ status: 'unauthenticated' });
        return;
      }
    }
    try {
      const me = await api.get<{ user: User; tenant: Tenant }>('/auth/me');
      set({ user: me.user, tenant: me.tenant, status: 'authenticated', isOwner: me.user.role === 'OWNER' });
    } catch {
      await tokenStore.clear();
      set({ status: 'unauthenticated', user: null, tenant: null });
    }
  },

  // Profil o'zgargach (sozlamalar) yoki qayta yuklashda /auth/me dan yangilash.
  async refreshMe() {
    try {
      const me = await api.get<{ user: User; tenant: Tenant }>('/auth/me');
      set({ user: me.user, tenant: me.tenant, isOwner: me.user.role === 'OWNER' });
    } catch {
      /* jim — sessiya bootstrap alohida boshqaradi */
    }
  },

  async login(email, password) {
    const res = await api.post<MobileAuthResponse>('/auth/login', { email, password });
    await applyTokens(res);
    set({ user: res.user, tenant: res.tenant, status: 'authenticated', isOwner: res.user.role === 'OWNER' });
  },

  async register(input) {
    const res = await api.post<MobileAuthResponse>('/auth/register', input);
    await applyTokens(res);
    set({ user: res.user, tenant: res.tenant, status: 'authenticated', isOwner: res.user.role === 'OWNER' });
  },

  // Parolni tiklash — token bermaydi; muvaffaqiyatdan so'ng foydalanuvchi
  // yangi parol bilan login qiladi.
  async forgotPassword(input) {
    await api.post('/auth/forgot-password', input);
  },

  async logout() {
    await unregisterPush().catch(() => undefined); // access token hali amal qiladi
    const refreshToken = await tokenStore.getRefresh();
    await api.post('/auth/logout', { refreshToken }).catch(() => undefined);
    await tokenStore.clear();
    set({ user: null, tenant: null, status: 'unauthenticated', isOwner: false });
  },
}));
