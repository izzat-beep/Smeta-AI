// O'zbekcha (lotin) — skelet uchun asosiy kalitlar. 3-bosqichda web
// tarjimalari (apps/web/src/i18n) bilan kengaytiriladi/birlashtiriladi.
export const uz = {
  common: {
    loading: 'Yuklanmoqda...',
    error: 'Xatolik yuz berdi',
    retry: 'Qayta urinish',
    save: 'Saqlash',
    cancel: 'Bekor qilish',
    logout: 'Chiqish',
  },
  validation: {
    email: "Email noto'g'ri",
    required: "Bu maydon to'ldirilishi shart",
    min2: 'Kamida 2 ta belgi',
    min6: 'Kamida 6 ta belgi',
  },
  auth: {
    loginTitle: 'Tizimga kirish',
    registerTitle: "Ro'yxatdan o'tish",
    forgotTitle: 'Parolni tiklash',
    email: 'Email',
    password: 'Parol',
    fullName: 'To\'liq ism',
    companyName: 'Kompaniya nomi',
    phone: 'Telefon',
    newPassword: 'Yangi parol',
    submit: 'Kirish',
    registerSubmit: "Ro'yxatdan o'tish",
    resetSubmit: 'Parolni tiklash',
    loggingIn: 'Kirilmoqda...',
    noAccount: "Hisobingiz yo'qmi? Ro'yxatdan o'ting",
    haveAccount: 'Hisobingiz bormi? Kiring',
    forgotLink: 'Parolni unutdingizmi?',
    backToLogin: 'Kirishga qaytish',
    resetSuccess: 'Parol yangilandi. Endi yangi parol bilan kiring.',
    forgotHint: "Ro'yxatdan o'tishda kiritgan telefon raqamingizni kiriting.",
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
