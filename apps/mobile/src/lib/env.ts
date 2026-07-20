import { Platform } from 'react-native';

// API bazaviy URL. EXPO_PUBLIC_API_URL build vaqtida keladi (.env).
// Android emulyatorda host 'localhost' — bu 10.0.2.2 orqali ko'rinadi,
// shuning uchun localhost berilsa avtomatik almashtiramiz (dev qulayligi).
function resolveBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!raw) {
    // Dev fallback — foydalanuvchi .env to'ldirmagan bo'lsa ogohlantiramiz.
    // eslint-disable-next-line no-console
    console.warn('[env] EXPO_PUBLIC_API_URL o\'rnatilmagan — .env.example ga qarang.');
    return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
  }
  if (Platform.OS === 'android') {
    return raw.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  return raw;
}

export const API_BASE_URL = resolveBaseUrl();
