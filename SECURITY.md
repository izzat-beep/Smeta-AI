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

## 1.1. Pentest-audit To'lqin 1 (2026-07-21) — non-breaking hardening

| ID | Zaiflik | CWE | Tuzatish |
|----|---------|-----|----------|
| **F3** | Global API rate-limiter yo'q edi (faqat auth/ai/voice) | CWE-770 | `index.ts`ga IP bo'yicha 300/min global limiter (DoS to'ri). |
| **F4** | `jwt.verify` `algorithms` pin qilinmagan (alg-confusion kelajak riski) | CWE-347 | `{ algorithms: ['HS256'] }` (tenant + admin). |
| **F5** | Audio upload faqat client-MIME'ga ishonardi | CWE-434 | `sniffAudio()` magic-byte tekshiruvi (OGG/WebM/WAV/MP4/MP3); soxta MIME → 415. |
| **F6** | Qidiruv/matn kirishi cheklanmagan (cost/DoS) | CWE-400 | materials/projects `q` `.slice(100)`, voice text `.slice(2000)`. |
| **F11** | `POST /register-device` rate-limitsiz | CWE-770 | user bo'yicha 20/soat limiter. |
| **Infra** | TLS/headerlar/VPS hardening | — | Caddyfile (HSTS preload, TLS1.2+, `-Server`, HTTP/3); `deploy/` (UFW, SSH key-only, fail2ban, Docker no-new-privileges/cap_drop/read-only). |

Regression testlar: `tests/security.test.ts` (`sniffAudio` qabul/rad — 8 assertion). Jami **43 test** yashil.

## 1.2. Pentest-audit To'lqin 2 (2026-07-21)

| ID | Zaiflik | CWE | Tuzatish |
|----|---------|-----|----------|
| **F1** | Ro'yxat so'rovlarida pagination yo'q (unbounded) | CWE-770 | projects/orders/sales/estimates/materials/realtors `take: 500` xavfsizlik cap'i (**non-breaking**; javob shakli o'zgarmadi). To'liq pagination — kelajak (breaking). |
| **F2** | Admin/moliya amallari uchun o'zgarmas iz yo'q (non-repudiation) | CWE-778 | **Append-only `AuditLog`** modeli (migratsiya `20260721110000_audit_log`) + `audit()` helper (`src/audit.ts`). admin.ts mutatsiyalari (user/vendor/tenant create/delete/update/block) log qilinadi (actor, IP, target, meta). Kodda faqat `create` — hech qachon update/delete. |
| **F8** | Eskirgan refresh-token yozuvlari to'planardi | CWE-459 | `src/cleanup.ts` — kunlik in-process job: expired + 30 kundan eski bekor tokenlarni o'chiradi (`startCleanupJobs`). |

## 1.3. Pentest-audit To'lqin 3 (2026-07-21) — arxitektura

| ID | Zaiflik | CWE | Tuzatish |
|----|---------|-----|----------|
| **F9** | bcrypt → argon2id afzalroq (GPU-resistant) | CWE-916 | `src/password.ts` — argon2id (OWASP params) + **bcrypt backward-compat**: eski hash'lar login paytida SHAFFOF argon2id'ga ko'chiriladi (`needsRehash`), migratsiyasiz. Barcha yozish yo'llari (register/forgot/admin/vendor/bootstrap) argon2id. 5 regression test (jami **48**). |
| **F7** | CSP `style-src 'unsafe-inline'` (Tailwind) | CWE-79 | **Qabul qilingan risk**: `script-src` allaqachon hash-based (H10); `style-src` nonce Tailwind bilan katta refaktor. XSS asosiy yuzasi (script) yopiq — style-inline ta'siri cheklangan. Kelajak ish. |
| **PG** | SSL/least-priv/backup | — | `deploy/postgres-hardening.md` (least-priv `smeta_app` roli, `hostssl` `pg_hba`, AuditLog UPDATE/DELETE REVOKE); `deploy/backup.sh` (3-2-1 age-shifrlangan + restore-test); DB porti tashqariga ochilmagan ✅. |
| **Monitor** | Anomaliya alertlari yo'q | CWE-778 | `deploy/monitoring.md` — brute-force/CORS-skan/kutilmagan-admin/AI-cost alert qoidalari (Loki/Vector yoki minimal journalctl+audit-digest). |

> **F9 breaking-risk:** yo'q — eski parollar ishlashda davom etadi, login'da avtomatik ko'chadi.
> **PG least-priv breaking:** ikki-URL (migrate owner / runtime smeta_app) — ataylab, hujjatlashtirilgan.

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
| **H6** | `DB_PASSWORD` default `smeta` edi (compose'da `:-smeta`, `DATABASE_URL`da ham) — konteyner tarmog'iga kirgan hujumchi ma'lum parol bilan DB'ga to'liq kirardi. | Compose'da default olib tashlandi (`${DB_PASSWORD:?...}` — o'rnatilmasa deploy to'xtaydi); `.env.prod.example` bo'shatildi + `openssl rand -base64 24` ko'rsatmasi. **BREAKING:** prod deploy `.env`da `DB_PASSWORD` talab qiladi. |
| **H7** | AI chat SSE xatosida (`ai.ts`) `err.message` productionda ham clientga uzatilardi (upstream xabari, kalit holati sizishi). | Productionda umumiy xabar; to'liq xato faqat `console.error`. Dev'da batafsil qoladi. |
| **H8** | Account lockout yo'q edi — IP rate-limit'ni chetlab (proxy/botnet bilan IP almashtirib) sekin brute-force qilish mumkin edi. | `User`/`AdminUser`/`Vendor`ga `failedLoginAttempts`+`lockedUntil` (migratsiya `20260719120000_login_lockout`). 10 ketma-ket xatodan so'ng akkaunt 15 daqiqaga bloklanadi (avto-ochiladi), muvaffaqiyatli login yoki parol tiklash hisoblagichni tozalaydi (`src/lockout.ts`). Chegara/muddat `.env` orqali sozlanadi. **Qoldiq risk:** mavjud akkauntni qasddan bloklab qo'yish (lockout-DoS) — yuqori chegara + avto-ochilish yumshatadi. |
| **H9** | API konteyneri `root` user'da ishlardi. | `apps/api/Dockerfile` endi `USER node` (uid 1000) bilan ishlaydi; `/app` egaligi shu user'ga o'tkaziladi. |
| **H10** | Web frontend CSP'sida `script-src 'unsafe-inline'` bor edi — XSS yuz bersa CSP inline skriptni to'smasdi. | `'unsafe-inline'` olib tashlandi; ikkita zarur inline skript (gtag config, tema FOUC) **SHA-256 hash** bo'yicha ruxsat etiladi, qolgani `'self'` + GTM host. Hash hisoblagich: `apps/web/scripts/csp-hashes.mjs`. `style-src 'unsafe-inline'` (Tailwind) hozircha qoladi. |
| **H11** | `JWT_REFRESH_SECRET` o'qilardi-yu, hech qayerda ishlatilmasdi (chalg'ituvchi/o'lik konfiguratsiya). | Endi refresh token DB hash'i uchun **HMAC-SHA256 kaliti** sifatida ishlatiladi (`auth.ts`, avval kalitsiz SHA-256 edi) — DB sizib ketsa hash'lar sirsiz qayta hisoblanmaydi. Eski tokenlar uchun **legacy fallback** (o'qishda) — sessiyalar uzilmaydi, ≤7 kunda o'z-o'zidan migratsiya bo'ladi. |
| **H12** | CI/CD yo'q edi — dependency zaifliklari va build/test regressiyalari avtomatik ushlanmasdi. | `.github/workflows/ci.yml`: har push/PR'da build (shared/api/web/admin) + xavfsizlik testlari + `npm audit --omit=dev --audit-level=high` (yuqori/kritik prod-zaiflikda yiqiladi). `.github/dependabot.yml`: haftalik npm + GitHub Actions yangilanishlari. |
| **H13** | Admin panelda 2FA yo'q edi — parol o'g'irlansa hisob to'liq ochiq. | Platforma adminlari uchun **TOTP 2FA** (RFC 6238, dependency'siz `src/totp.ts`, RFC test vektorlari bilan sinaladi). Sir DB'da **AES-256-GCM** bilan shifrlanadi (`src/totpCrypto.ts`, kalit JWT_SECRET'dan HKDF). Login'da noto'g'ri kod ham lockout'ga hisoblanadi. Setup/enable/disable route'lari (`/api/admin/2fa/*`) + admin frontend (login kod maydoni, "Xavfsizlik" sahifasi). Migratsiya `20260719130000_admin_2fa`. **Eslatma:** JWT_SECRET rotatsiya qilinsa saqlangan 2FA sirlari o'qilmaydi — adminlar qayta ulaydi. QR rasm hozircha yo'q (qo'lda kalit kiritish); vendorlar 2FA'siz (kelajakda). |

Regression testlar: `apps/api/tests/security.test.ts` (`npm run test -w @smeta/api`) —
URL sxemasi va admin parol siyosati uchun 12 test.

**Eslatma (breaking change):** endi production deploy `.env`da `ADMIN_PASSWORD`
o'rnatilmagan bo'lsa boshlanmaydi — bu ataylab qilingan.

---

## 5. Qolgan tavsiyalar (kelajak uchun)

- [x] ~~HSTS~~ (H5, 2026-07-19). Qolgani: **preload** va Caddy'da TLS minimal versiyasini sozlash.
- [x] ~~Account lockout~~ (H8, 2026-07-19).
- [x] ~~CSP `script-src 'unsafe-inline'`~~ olib tashlandi (H10). Qolgani: `style-src 'unsafe-inline'` (Tailwind/inline stillar) uchun hash/nonce.
- [x] ~~CI/CD dependency-skan~~ (H12: GitHub Actions `npm audit` + Dependabot).
- [ ] Legacy refresh-hash fallback'ini (`auth.ts`) 2026-08 dan keyin olib tashlash (barcha eski tokenlar muddati o'tgach).
- [x] ~~Admin panel uchun **2FA**~~ (H13, TOTP). Qolgani: QR rasm, vendor 2FA, backup-kodlar.
- [ ] Expired refresh-token yozuvlarini davriy tozalash (cron).
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
