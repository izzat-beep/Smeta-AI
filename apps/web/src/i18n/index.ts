import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { uz } from './uz';
import { ru } from './ru';

export const LANG_KEY = 'smeta_lang';
export const SUPPORTED_LANGS = ['uz', 'ru'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

function isLang(v: string | null | undefined): v is Lang {
  return v === 'uz' || v === 'ru';
}

// URL birinchi segmentidan tilni o'qiydi: "/ru/app" -> "ru", "/kirish" -> null.
export function langFromPath(pathname: string = window.location.pathname): Lang | null {
  const seg = pathname.split('/')[1];
  return isLang(seg) ? seg : null;
}

function storedLang(): Lang {
  try {
    const s = localStorage.getItem(LANG_KEY);
    return isLang(s) ? s : 'uz';
  } catch {
    return 'uz';
  }
}

// Ilova yuklanishida qo'llaniladigan til: AVVAL URL prefiksi (ulashilgan
// havola tilini belgilaydi), bo'lmasa saqlangan tanlov, bo'lmasa 'uz'.
export function resolveInitialLang(): Lang {
  return langFromPath() ?? storedLang();
}

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    ru: { translation: ru },
  },
  lng: resolveInitialLang(),
  fallbackLng: 'uz',
  interpolation: { escapeValue: false }, // React allaqachon XSS'dan himoya qiladi
});

// main.tsx bootstrap: URL har doim til prefiksiga ega bo'lishini ta'minlaydi
// (masalan "/kirish" -> "/uz/kirish") va router uchun basename qaytaradi.
// Shu tufayli barcha mavjud <Link to="/..."> / navigate('/...') avtomatik
// ravishda "/uz" yoki "/ru" bilan prefikslanadi — kod o'zgarmaydi.
export function bootstrapLangRouting(): string {
  const lang = resolveInitialLang();
  const { pathname, search, hash } = window.location;
  if (!langFromPath(pathname)) {
    const rest = pathname === '/' ? '' : pathname;
    window.history.replaceState(null, '', `/${lang}${rest}${search}${hash}`);
  }
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private rejim */
  }
  document.documentElement.lang = lang;
  return `/${lang}`;
}

// Tilni almashtiradi: URL prefiksi butun ilovaga (router basename) ta'sir
// qilgani uchun yangi til bilan to'liq qayta yuklaymiz. Foydalanuvchi holati
// localStorage/JWT'da saqlanib qoladi, URL esa tanlangan tilni aks ettiradi.
export function setLanguage(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private rejim */
  }
  const { pathname, search, hash } = window.location;
  const segs = pathname.split('/');
  if (isLang(segs[1])) segs[1] = lang;
  else segs.splice(1, 0, lang);
  const next = (segs.join('/') || `/${lang}`) + search + hash;
  if (next === pathname + search + hash) {
    // Bir xil til — qayta yuklash shart emas
    i18n.changeLanguage(lang);
    return;
  }
  window.location.assign(next);
}

export default i18n;
