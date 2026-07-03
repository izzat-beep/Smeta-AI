import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import Anthropic, { toFile } from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { z } from 'zod';
import { ah } from '../util.js';
import { config } from '../config.js';

export const voiceRouter = Router();

// Audio xotirada (diskка yozilmaydi — ishlov berilgach yo'qoladi). MIME whitelist + hajm limiti.
const AUDIO_MIME = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/x-m4a'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (AUDIO_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Audio format qo\'llab-quvvatlanmaydi'));
  },
});

// Rate-limit: foydalanuvchi bo'yicha 30 so'rov/soat.
const voiceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.sub ?? req.ip,
  message: { error: 'too_many_requests', message: 'Ovozli buyruq limiti (30/soat) tugadi. Keyinroq urinib ko\'ring.' },
});

const openai = config.ai.openaiKey ? new OpenAI({ apiKey: config.ai.openaiKey }) : null;
const claude = config.ai.apiKey ? new Anthropic({ apiKey: config.ai.apiKey }) : null;

const SYSTEM_PROMPT = `Sen "Smeta AI" ilovasining ovozli buyruq tahlilchisisan. Foydalanuvchi o'zbek yoki rus tilida gapiradi.
Matndan quyidagi JSON'ni chiqar (FAQAT toza JSON, markdown yoki izohsiz):
{
  "action": "add_payment" | "calculator_input" | "unknown",
  "amount": number|null,        // to'lov summasi yoki birlik narxi
  "currency": "USD"|"UZS"|null,
  "projectName": string|null,   // bino/loyiha nomi (add_payment uchun), mas. "Golden House"
  "unitName": string|null,      // honadon raqami/nomi, mas. "12"
  "qty": number|null,           // kalkulyator: dona/miqdor (mas. g'isht soni)
  "unitPrice": number|null,     // kalkulyator: dona/birlik narxi
  "unit": string|null,          // "dona" | "m2" | "m3" | "m"
  "itemName": string|null,      // kalkulyator: material/ish nomi (mas. "g'isht")
  "note": string|null
}
Qoidalar:
- "10 dollar keldi, Golden House uy o'n ikki" -> action=add_payment, amount=10, currency=USD, projectName="Golden House", unitName="12".
- "g'isht besh ming dona, donasi ming so'm" -> action=calculator_input, itemName="g'isht", qty=5000, unit="dona", unitPrice=1000, currency=UZS.
- So'z bilan aytilgan sonlarni raqamga aylantir (o'n ikki=12, besh ming=5000, ming=1000).
- "dollar/dollor" -> USD; "so'm/som/sum" -> UZS.
- Tushunmasang action="unknown".`;

const intentSchema = z.object({
  action: z.enum(['add_payment', 'calculator_input', 'unknown']).catch('unknown'),
  amount: z.number().nullable().catch(null),
  currency: z.enum(['USD', 'UZS']).nullable().catch(null),
  projectName: z.string().nullable().catch(null),
  unitName: z.string().nullable().catch(null),
  qty: z.number().nullable().catch(null),
  unitPrice: z.number().nullable().catch(null),
  unit: z.string().nullable().catch(null),
  itemName: z.string().nullable().catch(null),
  note: z.string().nullable().catch(null),
});
type Intent = z.infer<typeof intentSchema>;

// ─── Whisper (STT) ────────────────────────────────────────────────────────
async function transcribe(buffer: Buffer, mimetype: string): Promise<string> {
  if (!openai) throw new Error('STT_NOT_CONFIGURED');
  const ext = mimetype.includes('mp4') || mimetype.includes('m4a') ? 'mp4' : mimetype.includes('mpeg') || mimetype.includes('mp3') ? 'mp3' : mimetype.includes('wav') ? 'wav' : mimetype.includes('ogg') ? 'ogg' : 'webm';
  const file = await toFile(buffer, `audio.${ext}`, { type: mimetype });
  const res = await openai.audio.transcriptions.create({ file, model: config.ai.whisperModel });
  return res.text ?? '';
}

// ─── Intent (Claude yoki qoidaviy fallback) ─────────────────────────────────
async function parseIntent(text: string): Promise<Intent> {
  if (claude) {
    try {
      const msg = await claude.messages.create({
        model: config.ai.model,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }],
      });
      const raw = msg.content.filter((b) => b.type === 'text').map((b: any) => b.text).join('').trim();
      const jsonStr = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      return intentSchema.parse(JSON.parse(jsonStr));
    } catch {
      return ruleBasedIntent(text);
    }
  }
  return ruleBasedIntent(text);
}

// So'z-sonlar (o'zbek/rus) — demo fallback uchun asosiylari.
const WORD_NUMS: Record<string, number> = {
  'nol': 0, 'bir': 1, 'ikki': 2, 'uch': 3, "to'rt": 4, 'tort': 4, 'besh': 5, 'olti': 6, 'yetti': 7, 'sakkiz': 8, "to'qqiz": 9, 'toqqiz': 9,
  "o'n": 10, 'on': 10, 'yigirma': 20, "o'ttiz": 30, 'ottiz': 30, 'qirq': 40, 'ellik': 50,
  'yuz': 100, 'ming': 1000, 'million': 1000000,
  'один': 1, 'два': 2, 'три': 3, 'четыре': 4, 'пять': 5, 'шесть': 6, 'семь': 7, 'восемь': 8, 'девять': 9,
  'десять': 10, 'двенадцать': 12, 'сто': 100, 'тысяча': 1000, 'миллион': 1000000,
};

// Juda sodda so'z->son: ketma-ket so'zlarni yig'adi ("besh ming"=5000, "o'n ikki"=12).
function parseWordNumber(words: string[]): number | null {
  let total = 0;
  let current = 0;
  let found = false;
  for (const w of words) {
    const n = WORD_NUMS[w];
    if (n === undefined) continue;
    found = true;
    if (n >= 1000) {
      current = (current || 1) * n;
      total += current;
      current = 0;
    } else if (n === 100) {
      current = (current || 1) * 100;
    } else {
      current += n;
    }
  }
  total += current;
  return found ? total : null;
}

// Matn bo'lagidan sonni oladi: "10 ming"=10000, "besh ming"=5000, "1000", "ming"=1000.
function scaledNumber(seg: string): number | null {
  const m = seg.match(/(\d[\d\s]*)\s*(ming|million|минг|тысяч\w*|миллион\w*)?/u);
  if (m && /\d/.test(m[1])) {
    let n = Number(m[1].replace(/\s/g, ''));
    const scale = (m[2] || '').toLowerCase();
    if (/ming|тысяч/.test(scale)) n *= 1000;
    else if (/million|миллион/.test(scale)) n *= 1000000;
    return n;
  }
  const words = seg.split(/[^\p{L}\p{N}']+/u).filter(Boolean);
  return parseWordNumber(words);
}

function ruleBasedIntent(text: string): Intent {
  const t = text.toLowerCase();
  const currency: 'USD' | 'UZS' | null = /dollar|dollor|usd|доллар|\$/.test(t) ? 'USD' : /so'm|som|sum|uzs|сум/.test(t) ? 'UZS' : null;
  const isCalc = /g'isht|gisht|\bdona|kub|kvadrat|kirpich|штук|кирпич/.test(t);
  const isPayment = /kel|to'lo|tolo|pul|dollar|so'm|som|доллар|сум|плат|прин|дал|поступ|получ|пришл/.test(t);

  if (isCalc) {
    // "dona"/"donasi" bo'yicha bo'lamiz: [miqdor qismi] dona [narx qismi].
    const parts = t.split(/dona\w*/);
    const qty = scaledNumber(parts[0] ?? '');
    const unitPrice = parts.length > 1 ? scaledNumber(parts.slice(1).join(' ')) : null;
    const itemName = /g'isht|gisht|kirpich|кирпич/.test(t) ? "g'isht" : null;
    return intentSchema.parse({ action: 'calculator_input', qty, unit: 'dona', itemName, currency, unitPrice });
  }
  if (isPayment) {
    // Uy raqamini ajratib, matndan olib tashlaymiz (summa bilan aralashmasin).
    const houseMatch = t.match(/(?:uy|honadon|xonadon|квартир[а-яё]*|дом)\s*(?:raqami|№|nomer|номер)?\s*(\d+)/u);
    const unitName = houseMatch ? houseMatch[1] : null;
    const rest = houseMatch ? t.replace(houseMatch[0], ' ') : t;
    // Summa: valyuta so'zidan oldingi bo'lakdan.
    const curM = rest.match(/^([\s\S]*?)(dollar|dollor|so'm|som|sum|доллар|сум)/);
    const amount = scaledNumber(curM ? curM[1] : rest);
    if (amount) return intentSchema.parse({ action: 'add_payment', amount, currency: currency ?? 'UZS', unitName });
  }
  return intentSchema.parse({ action: 'unknown', note: text });
}

// ─── POST /api/voice/command ─────────────────────────────────────────────────
// Audio (multipart 'audio') YOKI { text } qabul qiladi. STT + intent qaytaradi.
voiceRouter.post(
  '/command',
  voiceLimiter,
  upload.single('audio'),
  ah(async (req, res) => {
    let transcript = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

    if (!transcript && req.file) {
      try {
        transcript = (await transcribe(req.file.buffer, req.file.mimetype)).trim();
      } catch (e: any) {
        if (e?.message === 'STT_NOT_CONFIGURED') {
          return res.status(501).json({
            error: 'stt_not_configured',
            message: 'Server STT (Whisper) sozlanmagan. OPENAI_API_KEY qo\'shing yoki brauzer ovoz tanish (Web Speech) rejimidan foydalaning.',
          });
        }
        return res.status(502).json({ error: 'stt_failed', message: 'Nutqni matnga aylantirib bo\'lmadi.' });
      }
    }

    if (!transcript) {
      return res.status(400).json({ error: 'bad_request', message: 'Matn yoki audio kerak.' });
    }

    const intent = await parseIntent(transcript);
    res.json({ transcript, intent });
  }),
);

// STT server tomonda mavjudmi (frontend qaysi yo'lni tanlashni bilishi uchun).
voiceRouter.get(
  '/config',
  ah(async (_req, res) => {
    res.json({ serverStt: !!openai, intent: claude ? 'claude' : 'rules' });
  }),
);
