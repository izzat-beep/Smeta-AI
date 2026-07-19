import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod';

// Async route handlerlarni o'rab, xatolarni next()'ga uzatadi
export const ah =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

// ─── URL maydonlari (avatarUrl/logoUrl/imageUrl) uchun xavfsiz sxema ─────────
// Faqat http(s) qabul qilinadi — javascript:, data: va boshqa sxemalar rad
// etiladi (saqlangan qiymat <img src> orqali render qilinadi).
const URL_MAX = 2048;

export const httpUrlString = z
  .string()
  .trim()
  .max(URL_MAX, { message: `URL ${URL_MAX} belgidan oshmasin` })
  .refine(
    (v) => {
      try {
        const u = new URL(v);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Faqat http(s) URL qabul qilinadi' },
  );

// Ixtiyoriy variant: undefined (maydon yuborilmagan) tegilmaydi, ''/null → null (tozalash).
export const optionalHttpUrl = z
  .union([z.literal(''), httpUrlString])
  .optional()
  .nullable()
  .transform((v) => (v === '' ? null : v));
