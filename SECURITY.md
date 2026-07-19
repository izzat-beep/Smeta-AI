# Xavfsizlik hujjati — Smeta AI

Ushbu hujjat backend xavfsizlik auditi (Vazifa 1) natijalarini, tuzatilgan
zaifliklarni va qolgan tavsiyalarni jamlaydi.

Sana: 2026-07-03 · Qamrov: `apps/api`, `apps/web`, `apps/admin`, infra (Caddy/nginx/Docker)

---

## 1. Topilgan zaifliklar va tuzatilgani

### 🔴 KRITIK

| ID | Zaiflik | Joy | Tuzatish |
|----|---------|-----|----------|
| **C1** | Admin API himoyasiz edi: `/api/admin` router `requireAdmin`siz ulangan, `/stats, /tenants, /tenants/:id, /invoices, /users` va **POST/PATCH/DELETE `/users`, PATCH `/tenants/:id`** endpointlarida umuman autentifikatsiya yo'q edi. Istalgan odam barcha tenant/foydalanuvchi ma'lumotini o'qiy, user yaratib/o'chira olardi. | `routes/admin.ts` | Auth (login/refresh/logout) route'laridan keyin `adminRouter.use(requireAdmin)` qo'yildi — bundan keyingi **barcha** route admin tokenini talab qiladi. `admin-users` route'lari `requireAdminRole('SUPERADMIN')` bilan himoyalandi. |

### 🟠 YUQORI

| ID | Zaiflik | Tuzatish |
|----|---------|----------|
| **C2** | CORS barcha originlarga ruxsat berardi (`cb(null, true)` fallback). | Faqat `config.cors.origins` ro'yxatidagi originlar (prod domen + `admin.` subdomen + dev localhost). Noma'lum origin `403` bilan rad etiladi. `credentials: true` saqlandi. |
| **C3** | RBAC yo'q edi — har autentifikatsiyalangan tenant foydalanuvchi barcha amalni bajara olardi. | Yagona `requireRole(...)` / `requireAdminRole(...)` middleware (`auth.ts`). Moliyaviy amallar (sotuv, to'lov, makler, umumiy harajatlar) va o'chirishlar (loyiha, material) **OWNER/MANAGER** ga cheklandi; kompaniya sozlamalari faqat **OWNER** uchun. |
| **C7** | JWT sirlari yo'q bo'lsa kodda `dev-secret-change-me` default ishlatilardi (prodda ham). | `config.ts` productionda **fail-fast**: `JWT_SECRET`/`JWT_REFRESH_SECRET` yo'q, dev-default yoki 32 belgidan qisqa bo'lsa, yoki ikkalasi bir xil bo'lsa — server ishga tushmaydi (`process.exit(1)`). |
| **C8** | Refresh token `localStorage`'da saqlanardi (XSS orqali o'g'irlash mumkin), rotatsiya/reuse-detection yo'q edi. | Refresh token endi **opaque tasodifiy token** (48 bayt), DB'da faqat **SHA-256 hash** saqlanadi, **httpOnly + Secure + SameSite=strict cookie**'da uzatiladi. Har refresh'da **rotatsiya** (eski bekor, yangi beriladi). **Reuse-detection**: bekor qilingan token qayta ishlatilsa — butun "family" bekor qilinadi. Access token qisqa muddatli (15 min) JWT. |

### 🟡 O'RTA

| ID | Zaiflik | Tuzatish |
|----|---------|----------|
| **C4** | `helmet` yo'q edi (xavfsizlik sarlavhalari). | API'ga `helmet()` qo'shildi (HSTS, `X-Content-Type-Options`, `X-Frame-Options` va h.k.). Frontend HTML (nginx) uchun to'liq **CSP**, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` qo'shildi. |
| **C5** | Login'da rate-limit yo'q, muvaffaqiyatsiz urinishlar log qilinmasdi. | `express-rate-limit`: login va parol tiklash uchun **IP bo'yicha 15 daqiqada 5 urinish** (muvaffaqiyatli loginlar hisobga olinmaydi). Muvaffaqiyatsiz urinishlar `console.warn` bilan (email, IP, sabab, vaqt) log qilinadi. Tenant va admin login uchun ham. |
| **C6** | Global error handler `err.message`'ni (ichki tafsilotlarni) clientga qaytarardi. | Productionda faqat umumiy xabar (`"Server xatosi yuz berdi"`) + to'liq `console.error` server log. Dev'da batafsil. `ZodError` → `400` (validatsiya tafsilotlari xavfsiz). |
| **C9** | Admin `GET /me` va `admin-users` route'lari `req.admin` o'rnatilmagani uchun buzilgan edi; parollar bcrypt cost 10. | C1 tuzatilgach `req.admin` to'g'ri o'rnatiladi. Yangi parollar bcrypt **cost 12** bilan hash qilinadi. |
| **C10** | Request body hajmi 2mb edi (cheklovsizga yaqin). | Global JSON limit **1mb**'ga tushirildi (fayl/audio yuklash keyin alohida endpointlarda oshiriladi). |

---

## 2. Tekshirilgan va xavfsiz topilgan joylar

- **SQL injection**: Kodda `$queryRaw`/`$executeRaw` **umuman ishlatilmagan** — barcha DB murojaatlari Prisma query builder orqali (parametrlangan). Xavf yo'q.
- **Parol hash**: Barcha parollar `bcrypt` bilan hashlanadi (endi cost 12). Plaintext parol saqlanmaydi.
- **Sezgir maydonlar**: `passwordHash` hech qachon API javobiga chiqmaydi — `serialize.ts` `user()`/`adminUser()` funksiyalari uni butunlay chiqarib tashlaydi.
- **XSS (render)**: Frontendda `dangerouslySetInnerHTML` yoki `innerHTML` **ishlatilmagan** — React barcha matnni avtomatik escape qiladi. CSP qo'shimcha himoya beradi.
- **`.env` sirlar**: `.env` fayllar `.gitignore`'da va git tarixida kuzatilmaydi (faqat `.env.example` / `.env.prod.example` namunalari commit qilingan). Kodda hardcode qilingan secret topilmadi.
- **Tenant izolyatsiyasi**: Tenant route'lari `where: { tenantId }` bilan filtrlaydi — mijozlar bir-birining ma'lumotini ko'ra olmaydi.

---

## 3. CSRF himoyasi

Asosiy auth **Bearer access token** (cookie'da emas) orqali bo'lgani uchun mutatsiya
endpointlari CSRF'ga zaif emas. Yagona cookie-asosli endpoint — `/auth/refresh` va
`/admin/auth/refresh`. Ular quyidagilar bilan himoyalangan:

1. Refresh cookie **`SameSite=strict`** — cross-site so'rovlarda umuman yuborilmaydi.
2. CORS faqat ma'lum originlarga `credentials` bilan ruxsat beradi — begona sayt
   refresh javobini o'qiy olmaydi.
3. Cookie **httpOnly** — JavaScript o'qiy olmaydi.

Kelajakda cookie-asosli mutatsiyalar qo'shilsa, double-submit CSRF token qo'shilishi kerak.

---

## 4. Token arxitekturasi (yangi)

```
Login/Register:
  → access token (JWT, 15 min)  → JSON body → localStorage (Bearer header)
  → refresh token (opaque)      → httpOnly Secure SameSite=strict cookie
                                   (DB'da SHA-256 hash, familyId bilan)

Access 401 bo'lganda:
  → frontend /auth/refresh ni cookie bilan chaqiradi
  → server tokenni tekshiradi, ROTATSIYA qiladi (eski bekor, yangi cookie)
  → yangi access token qaytadi → so'rov qayta yuboriladi

Reuse aniqlansa (bekor qilingan token qayta kelsa):
  → butun family bekor qilinadi → foydalanuvchi qayta login qilishi kerak
```

Cookie'lar subdomen bo'yicha izolyatsiya qilingan (`smeta_rt` — mijoz ilovasi,
`smeta_admin_rt` — admin), path bilan cheklangan (`/api/auth`, `/api/admin/auth`).

---

## 4.1. Qo'shimcha hardening (2026-07-19 audit)

| ID | Zaiflik | Tuzatish |
|----|---------|----------|
| **H1** | `docker-compose.prod.yml` da `ADMIN_PASSWORD` default `admin1234`, `bootstrap.ts` da `Smeta@Admin2026` — repoda ochiq parol bilan superadmin yaratilishi mumkin edi. | Compose'da default olib tashlandi (`${ADMIN_PASSWORD:?...}` — o'rnatilmasa deploy to'xtaydi). `bootstrap.ts` productionda **fail-fast**: parol yo'q, namuna/dev parol yoki 10 belgidan qisqa bo'lsa chiqib ketadi (`src/adminCreds.ts`). `render.yaml` va `.env.prod.example` ga `ADMIN_EMAIL`/`ADMIN_PASSWORD` qo'shildi. |
| **H2** | `POST /auth/register` rate-limitsiz — ommaviy soxta tenant (spam, tenant-boshiga AI limitlarini ko'paytirish). | `registerLimiter`: IP bo'yicha 1 soatda 5 urinish. |
| **H3** | `forgot-password` faqat IP bo'yicha cheklangan — IP almashtirib bitta akkaunt telefonini brute-force qilish mumkin edi. | Qo'shimcha `forgotEmailLimiter`: bitta email bo'yicha 1 soatda 5 urinish (IP'dan qat'i nazar). **Qoldiq risk (dizayn):** email+telefonni bilgan hujumchi parolni tiklay oladi — email/SMS tasdiqlash xizmati qo'shilganda bu oqim almashtirilishi kerak. |
| **H4** | `avatarUrl`/`logoUrl`/`imageUrl` istalgan satrni qabul qilardi (`javascript:`, `data:` sxemalar, cheksiz uzunlik) va `<img src>` orqali render qilinadi. | Yagona `optionalHttpUrl` zod sxemasi (`util.ts`): faqat `http(s)`, maks 2048 belgi; `''` → `null` (tozalash). `settings.ts`, `materials.ts`, `admin.ts` (vendor/product) ga qo'llandi. |
| **H5** | Frontend HTML javoblarida HSTS yo'q edi (helmet faqat API'ga qo'yadi). | Caddyfile'da ikkala saytga `Strict-Transport-Security: max-age=31536000; includeSubDomains`. |

Regression testlar: `apps/api/tests/security.test.ts` (`npm run test -w @smeta/api`) —
URL sxemasi va admin parol siyosati uchun 12 test.

**Eslatma (breaking change):** endi production deploy `.env`da `ADMIN_PASSWORD`
o'rnatilmagan bo'lsa boshlanmaydi — bu ataylab qilingan.

---

## 5. Qolgan tavsiyalar (kelajak uchun)

- [x] ~~HSTS~~ (H5, 2026-07-19). Qolgani: **preload** va Caddy'da TLS minimal versiyasini sozlash.
- [ ] Muvaffaqiyatsiz login urinishlarini DB'ga yozib, hisob bloklash (account lockout).
- [ ] Refresh token'larни davriy tozalash (expired yozuvlar uchun cron).
- [ ] CSP'dagi `'unsafe-inline'` (style/script) ni nonce/hash bilan almashtirish — hozir
      Google Analytics va Tailwind inline stillari uchun kerak.
- [ ] Docker Compose'da Postgres portini (`5432:5432`) faqat lokalда ochiq qoldirish;
      prodda tashqariga chiqarmaslik (`docker-compose.prod.yml`'da allaqachon port ochilmagan — yaxshi).
- [ ] `DB_PASSWORD` uchun kuchli tasodifiy parol (prod `.env`da) — namunadagi qiymatni almashtirish.
- [ ] 2FA (admin panel uchun).
- [ ] Fayl yuklash qo'shilganda (Vazifa 3 — audio): MIME whitelist, hajm limiti, fayl nomini sanitize qilish, ishlov berilgach o'chirish.
- [ ] API rate-limiting'ni boshqa endpointlarga ham kengaytirish (AI chat, voice).

---

## 6. Deploy eslatmasi

Productionда quyidagilar **majburiy** (aks holda API ishga tushmaydi):

```bash
JWT_SECRET=$(openssl rand -hex 32)          # ≥32 belgi
JWT_REFRESH_SECRET=$(openssl rand -hex 32)  # boshqa, ≥32 belgi
DB_PASSWORD=<kuchli-tasodifiy-parol>
DOMAIN=smeta-ai.uz                          # CORS origin avtomatik quriladi
ADMIN_PASSWORD=<kuchli-parol>               # bootstrap super admin uchun
```

Migratsiya VPS'da: `prisma migrate deploy` (Dockerfile `CMD`'da avtomatik).
Yangi migratsiya: `20260703100000_refresh_tokens`.
