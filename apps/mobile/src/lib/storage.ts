import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Umumiy KV saqlash (sozlamalar keshi: til, valyuta) — native'da SecureStore,
// web'da localStorage. (Alohida AsyncStorage dependency qo'shmaslik uchun
// SecureStore ishlatiladi — kichik sozlama qiymatlari uchun yetarli.)
const isWeb = Platform.OS === 'web';

export const storage = {
  async get(key: string): Promise<string | null> {
    if (isWeb) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (isWeb) {
      try {
        localStorage.setItem(key, value);
      } catch {
        /* ignore */
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
};
