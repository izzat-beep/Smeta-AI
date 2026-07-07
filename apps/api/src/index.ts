import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ZodError } from 'zod';
import { config } from './config.js';
import { requireAuth } from './auth.js';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { projectsRouter } from './routes/projects.js';
import { materialsRouter } from './routes/materials.js';
import { estimatesRouter } from './routes/estimates.js';
import { reportsRouter } from './routes/reports.js';
import { activitiesRouter } from './routes/activities.js';
import { settingsRouter } from './routes/settings.js';
import { aiRouter } from './routes/ai.js';
import { salesRouter } from './routes/sales.js';
import { realtorsRouter } from './routes/realtors.js';
import { expensesRouter } from './routes/expenses.js';
import { voiceRouter } from './routes/voice.js';
import { ordersRouter } from './routes/orders.js';
import { notificationsRouter } from './routes/notifications.js';
import { adminRouter } from './routes/admin.js';
const app = express();

// Caddy/reverse-proxy orqasida — haqiqiy client IP (X-Forwarded-For) va
// rate-limit to'g'ri ishlashi uchun bitta ishonchli proxy.
app.set('trust proxy', 1);

// ETag o'chirildi — 304 "Not Modified" javoblari eski (cached) ma'lumot
// ko'rsatishiga sabab bo'lmasligi uchun.
app.set('etag', false);

// Xavfsizlik sarlavhalari (helmet). API JSON qaytargani uchun CSP frontend
// (nginx) tomonida o'rnatiladi; bu yerda X-Frame-Options, HSTS, nosniff va h.k.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin: (origin, cb) => {
      // origin yo'q (curl/Postman/same-origin) yoki ruxsat etilgan ro'yxatda — ruxsat.
      if (!origin || config.cors.origins.includes(origin)) return cb(null, true);
      // Boshqa originlarga ruxsat berilmaydi (xatolik bilan rad etamiz).
      // Aynan qaysi origin bloklangani va ruxsat ro'yxati logga yoziladi — sozlashni osonlashtiradi.
      console.warn(
        `[CORS] Rad etildi — origin="${origin}" | ruxsat etilgan: ${config.cors.origins.join(', ') || '(BO\'SH — DOMAIN/WEB_ORIGIN o\'rnatilmagan!)'}`,
      );
      cb(new Error('CORS: bu origin uchun ruxsat yo\'q'));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
// Request body hajmi cheklovi (file upload'siz endpointlar uchun).
app.use(express.json({ limit: '1mb' }));

// API javoblari hech qachon keshlanmasin — deploy'dan keyin brauzer/proxy
// eski ma'lumotni ko'rsatib qolmasligi uchun.
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'smeta-ai-api', time: new Date().toISOString() }));

// Tenant (mijoz ilovasi) route'lari
app.use('/api/auth', authRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/projects', requireAuth, projectsRouter);
app.use('/api/materials', requireAuth, materialsRouter);
app.use('/api/estimates', requireAuth, estimatesRouter);
app.use('/api/reports', requireAuth, reportsRouter);
app.use('/api/activities', requireAuth, activitiesRouter);
app.use('/api/settings', requireAuth, settingsRouter);
app.use('/api/ai', requireAuth, aiRouter);
app.use('/api/sales', requireAuth, salesRouter);
app.use('/api/realtors', requireAuth, realtorsRouter);
app.use('/api/expenses', requireAuth, expensesRouter);
app.use('/api/voice', requireAuth, voiceRouter);
app.use('/api/orders', requireAuth, ordersRouter);
app.use('/api/notifications', requireAuth, notificationsRouter);

// Admin panel route'lari (o'z auth'i ichida)
app.use('/api/admin', adminRouter);

// 404
app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found', message: 'Endpoint topilmadi' }));

// Xato boshqaruvi — production'da ichki xato tafsilotlari (stack, message)
// clientga chiqmasin, faqat umumiy xabar + to'liq server log.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'validation_error', message: 'Ma\'lumotlar noto\'g\'ri', details: err.issues });
  }
  // CORS rad etish → 403.
  if (err instanceof Error && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: 'forbidden', message: 'CORS: ruxsat etilmagan origin' });
  }
  // Body-parser: juda katta yoki buzuq JSON → mos client xatosi (413/400).
  const anyErr = err as { type?: string; status?: number; statusCode?: number };
  if (anyErr?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'payload_too_large', message: 'So\'rov hajmi juda katta (maks. 1MB)' });
  }
  if (anyErr?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'bad_request', message: 'JSON formati noto\'g\'ri' });
  }
  console.error('[API error]', err);
  const message = config.isProd
    ? 'Server xatosi yuz berdi'
    : err instanceof Error
      ? err.message
      : 'Server xatosi';
  res.status(500).json({ error: 'server_error', message });
});

app.listen(config.port, () => {
  console.log(`\n  🏗️  Smeta AI API → http://localhost:${config.port}`);
  console.log(`  📦  Model: ${config.ai.model}  |  AI: ${config.ai.apiKey ? 'real (Claude)' : 'demo (mock)'}`);
  console.log(
    `  🌐  CORS ruxsat: ${config.cors.origins.join(', ') || '(BO\'SH! productionda DOMAIN yoki WEB_ORIGIN o\'rnating — aks holda brauzer so\'rovlari 403 bo\'ladi)'}\n`,
  );
});
