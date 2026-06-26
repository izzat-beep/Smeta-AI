import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
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
import { adminRouter } from './routes/admin.js';
const app = express();

// ETag o'chirildi — 304 "Not Modified" javoblari eski (cached) ma'lumot
// ko'rsatishiga sabab bo'lmasligi uchun.
app.set('etag', false);

app.use(
  cors({
    origin: (origin, cb) => {
      // origin yo'q (curl/Postman) yoki ruxsat etilgan ro'yxatda bo'lsa — ruxsat
      if (!origin || config.cors.origins.includes(origin)) return cb(null, true);
      cb(null, true); // demo: barcha originlarga ruxsat (prodda cheklang)
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));

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

// Admin panel route'lari (o'z auth'i ichida)
app.use('/api/admin', adminRouter);

// 404
app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found', message: 'Endpoint topilmadi' }));

// Xato boshqaruvi
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'validation_error', message: 'Ma\'lumotlar noto\'g\'ri', details: err.issues });
  }
  console.error('[API error]', err);
  const message = err instanceof Error ? err.message : 'Server xatosi';
  res.status(500).json({ error: 'server_error', message });
});

app.listen(config.port, () => {
  console.log(`\n  🏗️  Smeta AI API → http://localhost:${config.port}`);
  console.log(`  📦  Model: ${config.ai.model}  |  AI: ${config.ai.apiKey ? 'real (Claude)' : 'demo (mock)'}\n`);
});
