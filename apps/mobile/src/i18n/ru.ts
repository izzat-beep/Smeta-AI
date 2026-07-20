import type { Translations } from '@/i18n/uz';

// Ruscha (kirill) — kirill matn mobil default shriftlarda to'g'ri render bo'ladi.
export const ru: Translations = {
  common: {
    loading: 'Загрузка...',
    error: 'Произошла ошибка',
    retry: 'Повторить',
    save: 'Сохранить',
    cancel: 'Отмена',
    logout: 'Выйти',
  },
  validation: {
    email: 'Некорректный email',
    required: 'Это поле обязательно',
    min2: 'Минимум 2 символа',
    min6: 'Минимум 6 символов',
  },
  auth: {
    loginTitle: 'Вход в систему',
    registerTitle: 'Регистрация',
    forgotTitle: 'Восстановление пароля',
    email: 'Email',
    password: 'Пароль',
    fullName: 'Полное имя',
    companyName: 'Название компании',
    phone: 'Телефон',
    newPassword: 'Новый пароль',
    submit: 'Войти',
    registerSubmit: 'Зарегистрироваться',
    resetSubmit: 'Восстановить пароль',
    loggingIn: 'Вход...',
    noAccount: 'Нет аккаунта? Зарегистрируйтесь',
    haveAccount: 'Есть аккаунт? Войдите',
    forgotLink: 'Забыли пароль?',
    backToLogin: 'Вернуться ко входу',
    resetSuccess: 'Пароль обновлён. Войдите с новым паролем.',
    forgotHint: 'Введите номер телефона, указанный при регистрации.',
  },
  tabs: {
    dashboard: 'Главная',
    projects: 'Проекты',
    materials: 'Материалы',
    reports: 'Отчёты',
    settings: 'Настройки',
  },
  dashboard: {
    title: 'Главная',
    welcome: 'Добро пожаловать',
  },
};
