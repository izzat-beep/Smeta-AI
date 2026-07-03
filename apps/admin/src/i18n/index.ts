import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { uz } from './uz';
import { ru } from './ru';

export const LANG_KEY = 'smeta_admin_lang';
export type Lang = 'uz' | 'ru';

function initialLang(): Lang {
  const saved = localStorage.getItem(LANG_KEY);
  return saved === 'ru' || saved === 'uz' ? saved : 'uz';
}

i18n.use(initReactI18next).init({
  resources: { uz: { translation: uz }, ru: { translation: ru } },
  lng: initialLang(),
  fallbackLng: 'uz',
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: Lang) {
  i18n.changeLanguage(lang);
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
}

document.documentElement.lang = i18n.language;

export default i18n;
