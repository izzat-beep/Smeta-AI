import { create } from 'zustand';
import type { Currency } from '@smeta/shared';
import i18n from '@/i18n';
import { storage } from '@/lib/storage';
import { api } from '@/lib/api/client';

export type AppLanguage = 'uz' | 'ru';

const LANG_KEY = 'smeta_lang';
const CUR_KEY = 'smeta_currency';

interface SettingsState {
  language: AppLanguage;
  currency: Currency; // ko'rsatish valyutasi (UZS/USD)
  hydrate: () => Promise<void>;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  setCurrency: (cur: Currency) => Promise<void>;
}

export const useSettings = create<SettingsState>((set) => ({
  language: (i18n.language === 'ru' ? 'ru' : 'uz') as AppLanguage,
  currency: 'UZS',

  // Ilova ochilganda saqlangan til/valyutani yuklaydi.
  async hydrate() {
    const [lang, cur] = await Promise.all([storage.get(LANG_KEY), storage.get(CUR_KEY)]);
    if (lang === 'uz' || lang === 'ru') {
      await i18n.changeLanguage(lang);
      set({ language: lang });
    }
    if (cur === 'UZS' || cur === 'USD') set({ currency: cur });
  },

  async setLanguage(lang) {
    await i18n.changeLanguage(lang);
    set({ language: lang });
    await storage.set(LANG_KEY, lang);
    // Profilga ham saqlaymiz (fire-and-forget — xato bo'lsa lokal baribir ishlaydi).
    void api.patch('/settings', { language: lang }).catch(() => undefined);
  },

  async setCurrency(cur) {
    set({ currency: cur });
    await storage.set(CUR_KEY, cur);
  },
}));
