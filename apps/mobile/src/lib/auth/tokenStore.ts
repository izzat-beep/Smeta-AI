import * as SecureStore from 'expo-secure-store';

// Tokenlar Keychain (iOS) / Keystore (Android) da — expo-secure-store.
// Web'dagi localStorage'dan xavfsizroq. Refresh token endi mobil'da cookie
// emas, body'dan keladi (G1) va shu yerda saqlanadi.
const ACCESS_KEY = 'smeta_access';
const REFRESH_KEY = 'smeta_refresh';

export const tokenStore = {
  async getAccess(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },
  async getRefresh(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async set(access: string, refresh?: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    if (refresh !== undefined) await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  },
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};
