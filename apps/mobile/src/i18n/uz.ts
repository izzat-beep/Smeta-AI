// O'zbekcha (lotin) — skelet uchun asosiy kalitlar. 3-bosqichda web
// tarjimalari (apps/web/src/i18n) bilan kengaytiriladi/birlashtiriladi.
export const uz = {
  common: {
    loading: 'Yuklanmoqda...',
    error: 'Xatolik yuz berdi',
    retry: 'Qayta urinish',
    save: 'Saqlash',
    cancel: 'Bekor qilish',
  },
  auth: {
    loginTitle: 'Tizimga kirish',
    email: 'Email',
    password: 'Parol',
    submit: 'Kirish',
    loggingIn: 'Kirilmoqda...',
    noAccount: "Hisobingiz yo'qmi?",
  },
  tabs: {
    dashboard: 'Bosh sahifa',
    projects: 'Loyihalar',
    materials: 'Materiallar',
    reports: 'Hisobotlar',
    settings: 'Sozlamalar',
  },
  dashboard: {
    title: 'Bosh sahifa',
    welcome: 'Xush kelibsiz',
  },
};

// Tarjima tuzilishi (qiymatlar string) — ru.ts shu shaklga mos bo'lishi shart.
export type Translations = typeof uz;
