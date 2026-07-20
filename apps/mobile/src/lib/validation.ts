import { z } from 'zod';

// Backend zod sxemalari bilan mos (apps/api/src/routes/auth.ts):
//  - register: fullName≥2, email, password≥6, companyName≥2, phone?
//  - login: email, password
//  - forgot-password: email, phone≥3, newPassword≥6
// Xabarlar i18n kalitlari (ekranda t() bilan tarjima qilinadi).

export const loginSchema = z.object({
  email: z.string().email('validation.email'),
  password: z.string().min(1, 'validation.required'),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, 'validation.min2'),
  companyName: z.string().min(2, 'validation.min2'),
  email: z.string().email('validation.email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'validation.min6'),
});
export type RegisterForm = z.infer<typeof registerSchema>;

export const forgotSchema = z.object({
  email: z.string().email('validation.email'),
  phone: z.string().min(3, 'validation.required'),
  newPassword: z.string().min(6, 'validation.min6'),
});
export type ForgotForm = z.infer<typeof forgotSchema>;
