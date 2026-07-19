import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';
import { config } from '../config.js';

export const aiRouter = Router();

// ─── Chat rate-limit (audit #2: cheklovsiz AI xarajatining oldini olish) ──────
// Ikki qatlam: (1) tenant bo'yicha kunlik chegara — asosiy xarajat to'sig'i,
// (2) foydalanuvchi bo'yicha soatlik chegara — burst/skript hujumidan himoya.
// express-rate-limit (in-memory) — voice.ts bilan bir xil uslub.
const chatDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: config.ai.chat.dailyLimit,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => `tenant:${req.user?.tenantId ?? req.ip}`,
  message: {
    error: 'ai_daily_limit',
    message: `Kunlik AI suhbat limiti (${config.ai.chat.dailyLimit}) tugadi. Ertaga qayta urinib ko'ring yoki tarifni yangilang.`,
  },
});

const chatHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: config.ai.chat.hourlyLimit,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => `user:${req.user?.sub ?? req.ip}`,
  message: {
    error: 'ai_hourly_limit',
    message: `Soatlik AI suhbat limiti (${config.ai.chat.hourlyLimit}) tugadi. Biroz keyinroq urinib ko'ring.`,
  },
});

const SYSTEM_PROMPT = `Sen "Smeta AI" — O'zbekistondagi qurilish kompaniyalari, pudratchilar va muhandislar uchun mo'ljallangan aqlli smeta yordamchisisan.

Vazifang:
- Qurilish materiallari sarfini va xarajatlarini hisoblashda yordam berish (beton, g'isht, armatura, sement, bo'yoq va h.k.).
- O'zbekiston bozoridagi taxminiy narxlar (UZS va USD) asosida smeta tuzishga ko'maklashish.
- Material sarfi formulalari (maydon, qalinlik, hajm bo'yicha) va qurilish me'yorlari bo'yicha maslahat berish.

Qoidalar:
- Doim o'zbek tilida (lotin alifbosida) javob ber.
- Hisob-kitoblarni aniq va bosqichma-bosqich ko'rsat. Raqamlarni UZS da ber (kerak bo'lsa USD ham).
- Qisqa va amaliy bo'l. Aniqlik muhim — taxminiy bo'lsa, buni ayt.
- Agar ma'lumot yetishmasa, qaysi parametrlar kerakligini so'ra.`;

const client = config.ai.apiKey ? new Anthropic({ apiKey: config.ai.apiKey }) : null;

// Suhbatlar ro'yxati
aiRouter.get(
  '/sessions',
  ah(async (req, res) => {
    const sessions = await prisma.chatSession.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(sessions.map((s) => ({ id: s.id, title: s.title, createdAt: s.createdAt.toISOString() })));
  }),
);

// Bitta suhbat xabarlari
aiRouter.get(
  '/sessions/:id/messages',
  ah(async (req, res) => {
    const session = await prisma.chatSession.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) return res.status(404).json({ error: 'not_found', message: 'Suhbat topilmadi' });
    res.json(
      session.messages.map((m) => ({
        id: m.id,
        sessionId: m.sessionId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    );
  }),
);

const chatSchema = z.object({
  sessionId: z.string().optional().nullable(),
  // Xabar uzunligi cheklangan — 1 MB gacha promptlar orqali xarajat portlashini to'sadi.
  message: z
    .string()
    .min(1)
    .max(config.ai.chat.maxMessageChars, {
      message: `Xabar juda uzun (maksimal ${config.ai.chat.maxMessageChars} belgi).`,
    }),
});

// Claude'ga yuboriladigan suhbat tarixini cheklaydi: avval oxirgi N xabar,
// so'ng taxminiy token budjeti (belgi bo'yicha) — eng eskilari kesiladi.
// Anthropic API birinchi xabar 'user' bo'lishini talab qiladi, shu bois
// boshidagi 'assistant' xabarlar olib tashlanadi.
export function trimHistory(
  messages: { role: 'user' | 'assistant'; content: string }[],
): { role: 'user' | 'assistant'; content: string }[] {
  let out = messages.slice(-config.ai.chat.historyLimit);
  let totalChars = out.reduce((sum, m) => sum + m.content.length, 0);
  while (out.length > 1 && totalChars > config.ai.chat.historyMaxChars) {
    totalChars -= out[0].content.length;
    out = out.slice(1);
  }
  while (out.length > 1 && out[0].role !== 'user') {
    out = out.slice(1);
  }
  return out;
}

// Stream chat (Server-Sent Events)
aiRouter.post(
  '/chat',
  chatHourlyLimiter,
  chatDailyLimiter,
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const { sessionId, message } = chatSchema.parse(req.body);

    // Suhbatni topish yoki yaratish
    let session = sessionId
      ? await prisma.chatSession.findFirst({ where: { id: sessionId, tenantId } })
      : null;
    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          tenantId,
          userId: req.user!.sub,
          title: message.slice(0, 40),
        },
      });
    }

    // Foydalanuvchi xabarini saqlash
    await prisma.chatMessage.create({ data: { sessionId: session.id, role: 'user', content: message } });

    // Tarixni yuklash — so'ng Claude'ga yuborishdan oldin oxirgi N xabar +
    // token budjeti bilan kesamiz (uzun sessiyada har so'rov narxi o'smasin).
    const history = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });
    const messages = trimHistory(
      history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    );

    // SSE sarlavhalari
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };
    send('session', { sessionId: session.id });

    let full = '';

    if (client) {
      try {
        const stream = client.messages.stream({
          model: config.ai.model,
          max_tokens: config.ai.chat.maxTokens,
          system: SYSTEM_PROMPT,
          messages,
        });
        stream.on('text', (delta) => {
          full += delta;
          send('delta', { text: delta });
        });
        await stream.finalMessage();
      } catch (err: any) {
        // To'liq xato faqat server logiga — ichki tafsilotlar (upstream xabari,
        // kalit holati) clientga sizmasin. Foydalanuvchiga umumiy xabar.
        // eslint-disable-next-line no-console
        console.error('[ai/chat] Claude stream xatosi:', err);
        const msg = config.isProd
          ? "Kechirasiz, AI xizmatiga hozir ulanib bo'lmadi. Biroz o'tib qayta urinib ko'ring."
          : `Kechirasiz, AI xizmatiga ulanishda xatolik yuz berdi: ${err?.message ?? 'noma\'lum'}. ANTHROPIC_API_KEY to'g'ri sozlanganini tekshiring.`;
        full = msg;
        send('delta', { text: msg });
      }
    } else {
      // API kaliti yo'q — demo uchun namunaviy javob
      const demo = mockReply(message);
      for (const chunk of demo.match(/.{1,8}/gs) ?? [demo]) {
        full += chunk;
        send('delta', { text: chunk });
        await new Promise((r) => setTimeout(r, 12));
      }
    }

    // Javobni saqlash
    await prisma.chatMessage.create({ data: { sessionId: session.id, role: 'assistant', content: full } });
    await prisma.chatSession.update({ where: { id: session.id }, data: { updatedAt: new Date() } });

    send('done', { sessionId: session.id });
    res.end();
  }),
);

function mockReply(message: string): string {
  return `Salom! Men Smeta AI yordamchisiman. Sizning "${message.slice(0, 60)}" so'rovingiz bo'yicha:

Hozir demo rejimida ishlayapman (ANTHROPIC_API_KEY sozlanmagan). Real javoblar uchun .env faylida API kalitni qo'shing.

Misol hisob-kitob: 4×5 m xona, balandligi 3 m bo'lsa — devor yuzasi ≈ 54 m². 2 qavat bo'yoq uchun taxminan 12–15 litr emulsiya kerak bo'ladi.`;
}
