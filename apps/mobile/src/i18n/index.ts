import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { uz } from '@/i18n/uz';
import { ru } from '@/i18n/ru';

// Boshlang'ich til: qurilma tili 'ru' bo'lsa — ruscha, aks holda o'zbekcha.
// (3-bosqichda foydalanuvchi profilidagi user.language ustuvor qilinadi.)
const deviceLang = getLocales()[0]?.languageCode === 'ru' ? 'ru' : 'uz';

void i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    ru: { translation: ru },
  },
  lng: deviceLang,
  fallbackLng: 'uz',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
export type AppLanguage = 'uz' | 'ru';
