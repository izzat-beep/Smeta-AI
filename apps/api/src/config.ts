import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Monorepo ildizidagi .env ni yuklaymiz
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // lokal .env ham (agar bo'lsa)

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProd = nodeEnv === 'production';

// Dev uchun default (xavfsiz emas) qiymatlar — prodda ishlatilishi taqiqlanadi.
const DEV_JWT_SECRET = 'dev-secret-change-me';
const DEV_JWT_REFRESH_SECRET = 'dev-refresh-secret-change-me';

const jwtSecret = process.env.JWT_SECRET ?? DEV_JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET ?? DEV_JWT_REFRESH_SECRET;

// ─── Fail-fast: productionda zaif/yo'q sirlar bilan ishga tushmaymiz ─────────
if (isProd) {
  const problems: string[] = [];
  if (!process.env.JWT_SECRET || jwtSecret === DEV_JWT_SECRET || jwtSecret.length < 32) {
    problems.push('JWT_SECRET yo\'q, dev-default yoki 32 belgidan qisqa');
  }
  if (
    !process.env.JWT_REFRESH_SECRET ||
    jwtRefreshSecret === DEV_JWT_REFRESH_SECRET ||
    jwtRefreshSecret.length < 32
  ) {
    problems.push('JWT_REFRESH_SECRET yo\'q, dev-default yoki 32 belgidan qisqa');
  }
  if (jwtSecret === jwtRefreshSecret) {
    problems.push('JWT_SECRET va JWT_REFRESH_SECRET bir xil bo\'lmasligi kerak');
  }
  if (problems.length) {
    // eslint-disable-next-line no-console
    console.error(
      '\n  ❌ Xavfsizlik: production konfiguratsiyasi yaroqsiz:\n' +
        problems.map((p) => `     • ${p}`).join('\n') +
        '\n  JWT kalitlarni sozlang (openssl rand -hex 32) va qayta ishga tushiring.\n',
    );
    process.exit(1);
  }
}

// ─── CORS ruxsat etilgan originlar ───────────────────────────────────────────
function buildCorsOrigins(): string[] {
  const set = new Set<string>();
  const add = (v?: string | null) => {
    if (v) v.split(',').map((s) => s.trim()).filter(Boolean).forEach((o) => set.add(o));
  };
  add(process.env.WEB_ORIGIN);
  add(process.env.ADMIN_ORIGIN);
  add(process.env.CORS_ORIGINS);
  // Domen berilgan bo'lsa: https://DOMAIN va https://admin.DOMAIN
  const domain = process.env.DOMAIN?.trim();
  if (domain) {
    set.add(`https://${domain}`);
    set.add(`https://admin.${domain}`);
  }
  // Dev uchun lokal originlar
  if (!isProd) {
    set.add('http://localhost:5173');
    set.add('http://localhost:5174');
  }
  return [...set];
}

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  nodeEnv,
  isProd,
  jwt: {
    secret: jwtSecret,
    refreshSecret: jwtRefreshSecret,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    // Refresh token amal qilish muddati (kun) — DB yozuvi uchun.
    refreshDays: Number(process.env.JWT_REFRESH_DAYS ?? 7),
  },
  ai: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.AI_MODEL ?? 'claude-opus-4-8',
    // STT (nutqni matnga) uchun OpenAI Whisper. Bo'sh bo'lsa demo rejim (brauzer STT).
    openaiKey: process.env.OPENAI_API_KEY ?? '',
    whisperModel: process.env.WHISPER_MODEL ?? 'whisper-1',
  },
  cors: {
    origins: buildCorsOrigins(),
  },
  cookie: {
    // Refresh token cookie: prodda Secure + SameSite=strict; devda http bo'lgani uchun Secure=false.
    secure: isProd,
    sameSite: 'strict' as const,
  },
};
