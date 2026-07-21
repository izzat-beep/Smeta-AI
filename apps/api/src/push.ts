// Expo Push — qurilmalarga push bildirishnoma yuborish (STAGE 3.9 mobil).
// Best-effort: xato bo'lsa jim loglaymiz, asosiy oqim (DB notification) buzilmaydi.
import { prisma } from './prisma.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendExpoPush(tokens: string[], payload: PushPayload): Promise<void> {
  // Faqat haqiqiy Expo tokenlari.
  const valid = tokens.filter((t) => t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken'));
  if (!valid.length) return;
  const messages = valid.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    sound: 'default' as const,
  }));
  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[push] Expo yuborishda xato:', err);
  }
}

// Foydalanuvchining barcha qurilmalariga push (fire-and-forget chaqiriladi).
export async function pushToUser(userId: string, payload: PushPayload): Promise<void> {
  try {
    const devices = await prisma.deviceToken.findMany({ where: { userId }, select: { token: true } });
    if (!devices.length) return;
    await sendExpoPush(
      devices.map((d) => d.token),
      payload,
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[push] pushToUser xato:', err);
  }
}
