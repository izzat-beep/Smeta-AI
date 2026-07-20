import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Tokenlar native'da Keychain (iOS) / Keystore (Android) da — expo-secure-store.
// Web'da (Chrome "simulyator") SecureStore mavjud emas — localStorage'ga tushamiz.
// Refresh token mobil'da cookie emas, body'dan keladi (G1) va shu yerda saqlanadi.
const ACCESS_KEY = 'smeta_access';
const REFRESH_KEY = 'smeta_refresh';
const isWeb = Platform.OS === 'web';

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode / SSR — jim o'tamiz */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const tokenStore = {
  getAccess: () => getItem(ACCESS_KEY),
  getRefresh: () => getItem(REFRESH_KEY),
  async set(access: string, refresh?: string): Promise<void> {
    await setItem(ACCESS_KEY, access);
    if (refresh !== undefined) await setItem(REFRESH_KEY, refresh);
  },
  async clear(): Promise<void> {
    await removeItem(ACCESS_KEY);
    await removeItem(REFRESH_KEY);
  },
};
