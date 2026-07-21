// Davriy tozalash (CWE-459 / F8): eskirgan refresh-token yozuvlari to'planib
// qolmasin. In-process kunlik job (bitta konteynerli deploy uchun yetarli;
// ko'p instansiya bo'lsa alohida cron/scheduler tavsiya etiladi).
import { prisma } from './prisma.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const REVOKED_RETENTION_MS = 30 * DAY_MS; // bekor qilinganini 30 kun saqlaymiz (audit uchun)

export async function purgeExpiredTokens(): Promise<number> {
  const now = new Date();
  const revokedCutoff = new Date(Date.now() - REVOKED_RETENTION_MS);
  try {
    const { count } = await prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null, lt: revokedCutoff } }],
      },
    });
    if (count) {
      // eslint-disable-next-line no-console
      console.log(`[cleanup] ${count} ta eskirgan/bekor refresh-token o'chirildi`);
    }
    return count;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[cleanup] xato:', err);
    return 0;
  }
}

export function startCleanupJobs(): void {
  void purgeExpiredTokens(); // start'da bir marta
  // .unref() — bu timer process'ni tirik ushlab turmaydi.
  setInterval(() => void purgeExpiredTokens(), DAY_MS).unref();
}
