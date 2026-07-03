import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { uz } from './uz';
import { ru } from './ru';

export const LANG_KEY = 'smeta_lang';
export const SUPPORTED_LANGS = ['uz', 'ru'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

function initialLang(): Lang {
  const saved = localStorage.getItem(LANG_KEY);
  return saved === 'ru' || saved === 'uz' ? saved : 'uz';
}

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    ru: { translation: ru },
  },
  lng: initialLang(),
  fallbackLng: 'uz',
  interpolation: { escapeValue: false }, // React allaqachon XSS'dan himoya qiladi
});

// Tilni o'zgartiradi va localStorage'ga saqlaydi (darhol qo'llanadi).
export function setLanguage(lang: Lang) {
  i18n.changeLanguage(lang);
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
}

document.documentElement.lang = i18n.language;

export default i18n;
