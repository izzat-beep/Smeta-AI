import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { api } from '@/lib/api/client';

// Push bildirishnoma (STAGE 3.9). Web/simulyatorda token bo'lmaydi — jim o'tamiz.
// Foreground'da bildirishnoma ko'rinsin.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function getExpoToken(): Promise<string | null> {
  if (!Device.isDevice) return null; // web/simulyatorda push yo'q
  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted && existing.canAskAgain) {
    granted = (await Notifications.requestPermissionsAsync()).granted;
  }
  if (!granted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;
  try {
    const res = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return res.data;
  } catch {
    return null;
  }
}

// Login'dan keyin chaqiriladi — tokenni backendga ro'yxatdan o'tkazadi.
export async function registerForPush(): Promise<void> {
  const token = await getExpoToken();
  if (!token) return;
  await api.post('/notifications/register-device', { token, platform: Platform.OS }).catch(() => undefined);
}

// Logout'da chaqiriladi — tokenni backenddan o'chiradi.
export async function unregisterPush(): Promise<void> {
  const token = await getExpoToken();
  if (!token) return;
  await api.delete('/notifications/device', { token }).catch(() => undefined);
}
