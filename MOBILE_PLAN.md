# MOBILE_PLAN.md — Smeta AI mobil ilova · 1-BOSQICH (TAHLIL)

> Bu faqat **1-bosqich (tahlil)**. Kod yozilmadi. Oxirida tasdiqlash uchun to'xtaladi.
> Barcha ma'lumot repozitoriyning haqiqiy kodidan o'qib olindi (taxmin emas).

## 0. Prompt'dagi noaniqliklarni to'g'rilash (faktlar kod bazasidan)

| Prompt'da aytilgan | Haqiqiy holat (koddan) |
|---|---|
| Frontend: **Next.js** / React | **Vite + React 18 + React Router** SPA. Next.js YO'Q. Ikki alohida SPA: `apps/web` (mijoz) va `apps/admin` (admin/vendor). |
| **affiliate/referral tizimi** | Kodda referral/affiliate **route yoki modeli yo'q** — faqat Landing/Login sahifalarida marketing matni. Mobil MVP'ga kirmaydi (mavjud emas). |
| Monorepo | To'g'ri: npm workspaces — `apps/api`, `apps/web`, `apps/admin`, `packages/shared`. Mobil `apps/mobile` bo'lib qo'shiladi. |
| Ovozli buyruq: MediaRecorder → Whisper → Claude | To'g'ri: `POST /api/voice/command` (multer audio yoki `{text}`) → `{transcript, intent}`. |

**Umumiy tiplar allaqachon `packages/shared/src/index.ts` da** — mobil ilova ham shu paketni import qiladi (backend bilan bitta manbadan tiplar).

---

## 1. Backend API inventarizatsiyasi

Barcha route'lar `apps/api/src/routes/*`. Bazaviy prefiks `/api`. Auth ustuni:
**Public** = ochiq · **Bearer** = `Authorization: Bearer <accessJWT>` (tenant) · **Role** = qo'shimcha `requireRole` · **Admin** = admin JWT (mobil'ga kirmaydi).

### Auth — `/api/auth` (`routes/auth.ts`)
| Metod | Path | Auth | Request | Response | Eslatma |
|---|---|---|---|---|---|
| POST | `/register` | Public | `{fullName,email,password(min6),companyName,phone?}` | `201 {user, tenant, tokens:{accessToken}}` + refresh **cookie** | rate-limit 5/soat/IP |
| POST | `/login` | Public | `{email,password}` | `{user, tenant, tokens:{accessToken}}` + refresh cookie | rate-limit 5/15daq; account lockout (10→15daq) |
| POST | `/forgot-password` | Public | `{email,phone,newPassword(min6)}` | `{ok,message}` | email+telefon mos kelsa parol tiklanadi |
| POST | `/refresh` | Cookie | — (refresh cookie'dan) | `{tokens:{accessToken}}` + yangi refresh cookie | rotatsiya + reuse-detection |
| POST | `/logout` | Cookie | — | `{ok}` | refresh oilasi bekor qilinadi |
| GET | `/me` | Bearer | — | `{user, tenant}` | |

### Dashboard — `/api/dashboard` (Bearer)
| GET | `/` | jamlangan: `{stats, activeProjects[], recentActivity[], aiRecommendation}` |
| GET | `/stats` | moliyaviy agregatlar + `trends` (UZS) |
| GET | `/expense-dynamics?months=6` | `{months:[{...actual,planned}], currency}` |
| GET | `/resource-usage` | resurs sarfi foizlari |

### Projects — `/api/projects` (Bearer)
| GET | `/?q=&status=` | `Project[]` (manager bilan) |
| GET | `/summaries` | `{[projectId]:{spent,income,estimatesCount}}` |
| GET | `/:id/summary` | KPI: budget/totalExpenses/totalIncome/netProfit/budgetUsedPercent |
| GET | `/:id` | `Project` + `estimates[]` |
| GET | `/:id/finance` | bino moliyasi (kelgan pul, harajat, foyda, sotilgan honadonlar) |
| POST | `/` | `{title,clientName,category?,value?,currency?,deadline?,progress?,status?,managerId?,totalUnits?,purchasePrice?,address?,description?,startDate?}` → `201 Project` |
| PATCH | `/:id` | qisman upsert |
| DELETE | `/:id` | **Role(OWNER/MANAGER)**; smetalari bor bo'lsa `409` |

### Materials — `/api/materials` (Bearer)
| GET | `/?q=&category=` | global (tenantId=null) + tenant materiallari + faol vendor mahsulotlari |
| GET | `/categories` | `string[]` |
| GET | `/:id` | `Material` |
| POST | `/` | `{name,category?,provider?,description?,unit?,priceUzs?,priceUsd?,stock?,rating?,imageUrl?}` |
| PATCH | `/:id` | qisman |
| DELETE | `/:id` | **Role(OWNER/MANAGER)** |

### Estimates (smeta) — `/api/estimates` (Bearer)
| POST | `/calc` | tez hisob (saqlamasdan): `{items[],taxRate?}` → `{items,subtotal,taxAmount,total,breakdown}` |
| GET | `/?projectId=` | `Estimate[]` (`projectId=none` → loyihasizlar) |
| GET | `/:id` | `Estimate` (items+stages) |
| POST | `/` | `{title,projectId?,currency?,taxRate?,items[],stages[],generalExpenses?,generalExpensesCurrency?}` → `201` (bitta tranzaksiya) |
| PATCH | `/:id` | loyihaga bog'lash / nom |
| DELETE | `/:id` | |

### Reports — `/api/reports` (Bearer)
| GET | `/summary?projectId=&from=&to=&period=YYYY-MM` | kartalar + planFakt + resourceUsage + costDynamics + trends |
| GET | `/` | `/summary` bilan bir xil (orqaga moslik) |

### Expenses (umumiy harajatlar) — `/api/expenses` (Bearer)
| GET | `/?projectId=` | `{items:[{id,label,amount,orderId}],currency,projectId}` |
| POST | `/` | **Role(OWNER/MANAGER)** replace-all: `{projectId?,currency?,rows[]}` (orderId qatorlari saqlanadi) |
| GET | `/list?projectId=&from=&to=` | yozuvlar (kategoriya/sana bilan, ≤200) |
| POST | `/add` | `{label,amount,currency?,category?,projectId?,spentAt?,note?}` → `201` |
| PATCH | `/:id` | (id — **integer**) |
| DELETE | `/:id` | |

### Incomes (daromad) — `/api/incomes` (Bearer)
| GET | `/?projectId=&from=&to=` · POST `/` · PATCH `/:id` · DELETE `/:id` | `{projectId?,amount,currency?,date?,description?}` |

### Budget-plans (reja/me'yor) — `/api/budget-plans` (Bearer)
| GET | `/?period=YYYY-MM&projectId=` · PUT `/` (upsert) · DELETE `/:id` | `{category:MATERIAL/LABOR/EQUIPMENT/GENERAL, plannedAmount, currency?, period}` |

### Sales & Payments (honadon sotuvi) — `/api/sales` (Bearer)
| GET | `/?unit=&projectId=&sort=lastPayment` | `{sales[], totalsByCurrency, count}` |
| POST | `/` | **Role** yangi sotuv |
| GET | `/:saleId/payments` · POST `/:saleId/payments` (**Role**) | to'lovlar tarixi; `Sale.paid` avto qayta hisoblanadi |
| DELETE | `/payments/:id` (**Role**) · PATCH `/:id` (**Role**) · DELETE `/:id` (**Role**) | |

### Realtors (maklerlar) — `/api/realtors` (Bearer)
| GET `/` · POST `/` (**Role**) · PATCH `/:id` (**Role**) · DELETE `/:id` (**Role**) | `{name, phone?}` + komissiya statistikasi |

### Orders (marketplace buyurtma) — `/api/orders` (Bearer)
| GET | `/` · GET `/:id` | tenant buyurtmalari (items bilan) |
| POST | `/` | `{customerName,customerPhone,address?,note?,currency?,projectId?,items[{materialId?,name,unit?,unitPrice,qty}]}` → buyurtma **+ avto GeneralExpenses + vendorga bildirishnoma** bitta tranzaksiyada. **`orderId` idempotent** (GeneralExpenses.orderId UNIQUE). |

### Notifications — `/api/notifications` (Bearer)
| GET | `/?page=&pageSize=` · GET `/unread-count` · PATCH `/read-all` · PATCH `/:id/read` | polling uchun `/unread-count` yengil |

### Voice (ovozli buyruq) — `/api/voice` (Bearer)
| POST | `/command` | multipart `audio` (≤10MB, MIME whitelist) **yoki** `{text}` → `{transcript, intent}`. rate-limit 30/soat. Whisper yo'q bo'lsa `501` (brauzer STT'ga tushadi) |
| GET | `/config` | `{serverStt:boolean, intent:'claude'|'rules'}` |

### AI chat — `/api/ai` (Bearer)
| GET | `/sessions` · GET `/sessions/:id/messages` | suhbatlar |
| POST | `/chat` | **SSE stream** (`text/event-stream`): eventlar `session`/`delta`/`done`. `{sessionId?, message(≤4000)}`. rate-limit: 40/soat/user + 100/kun/tenant |

### Settings — `/api/settings` (Bearer)
| GET | `/` → `{user,tenant}` · PATCH `/` | `{fullName?,phone?,position?,avatarUrl?,language?('uz'|'ru'),company?{name,inn,phone,usdRate}}` — `company`ni faqat **OWNER** |

### Activities — `/api/activities` (Bearer)
| GET | `/` | oxirgi 30 faollik |

### Admin — `/api/admin/*` (`routes/admin.ts`) → **FAQAT WEB**
Admin/vendor login (2FA bilan), tenant/user/vendor/invoice boshqaruvi, vendor kabineti. Mobil MVP'ga **kirmaydi**.

### Health
| GET | `/api/health` | Public `{ok,service,time}` |

### Xatolik formati (butun API bo'yicha yagona)
```jsonc
{ "error": "<kod>", "message": "<o'zbekcha xabar>", "details?": <zod issues> }
```
| Status | error kodi |
|---|---|
| 400 | `validation_error` (zod `details` bilan), `bad_request` |
| 401 | `unauthorized` |
| 403 | `forbidden` (CORS yoki RBAC) |
| 404 | `not_found` |
| 409 | `conflict` |
| 413 | `payload_too_large` (>1MB) |
| 429 | `too_many_requests`, `ai_hourly_limit`, `ai_daily_limit`, `account_locked` |
| 500 | `server_error` (prodda umumiy xabar) |

---

## 2. Ma'lumotlar modeli (`schema.prisma`) — mobil uchun kerakli qism

**Mobil ilova ishlatadigan modellar** (tenant-scoped, hammasi `tenantId` bilan filtrlangan):

```
Tenant (1) ──< User (OWNER|MANAGER|ENGINEER)
   │             usdRate (1 USD = X so'm — valyuta konvertatsiyasi shu yerdan)
   ├─< Project ──< Estimate ──< EstimateItem (MATERIAL|LABOR|EQUIPMENT, PaymentType)
   │      │            └──< EstimateStage (bosqichlar/to'lov jadvali)
   │      ├─< generalExpenses (label, amount, currency, category, orderId?)
   │      ├─< Income
   │      ├─< BudgetPlan (category × period 'YYYY-MM' — Reja/Fakt)
   │      └─< Sale ──< Payment    (Sale.realtorId → Realtor)
   ├─< Material (tenantId=null → global katalog; vendorId → marketplace)
   ├─< Order ──< OrderItem   (Order.projectId?, status: NEW..DELIVERED/CANCELLED)
   ├─< Activity (feed)
   ├─< ChatSession ──< ChatMessage (role: user|assistant)
   └─< Notification (userId → mijoz; type: NEW_ORDER|ORDER_STATUS|MESSAGE)
```

**Muhim tiplar/enumlar:** `Currency` (UZS|USD), `ProjectStatus`, `EstimateItemType`, `PaymentType` (PER_M2/M3/METER/UNIT/FIXED/HOURLY), `OrderStatus`, `NotificationType`. Pul maydonlari Postgres `Decimal(18,2)` — serializatsiyada `number`ga o'giriladi (`serialize.ts`).

**Faqat web/backend (mobil'ga kerak emas):** `AdminUser`, `Vendor`, `Invoice`, `RefreshToken`.

**Serializatsiya:** barcha javoblar `serialize.ts` orqali — `passwordHash`/`totpSecret` **hech qachon chiqmaydi**, `Decimal→number`, `Date→ISO string`.

---

## 3. Autentifikatsiya oqimi va mobil muqobili

### Hozirgi mexanizm (web)
- **Access token:** qisqa muddatli **JWT (15 daq)**, JSON body'da qaytadi (`tokens.accessToken`), `Authorization: Bearer` header'da yuboriladi. Web'da `localStorage`.
- **Refresh token:** **opaque 48-bayt** tasodifiy token, DB'da faqat **HMAC-SHA256 hash**, **httpOnly + Secure + SameSite=strict cookie**'da (path `/api/auth`). Har refresh'da **rotatsiya**, reuse-detection (o'g'irlangan token → butun "oila" bekor).
- Payload: `{sub(userId), tenantId, role, kind:'tenant'}`.

### Muammo (mobil uchun)
React Native'da brauzer cookie-jar yo'q; `SameSite=strict`/`Secure` cookie oqimi RN `fetch`da ishonchsiz. Shuning uchun refresh tokenni **cookie'siz** olish kerak.

### Taklif: mobil uchun token-based (minimal backend o'zgarish)
Mavjud rotatsiya/reuse-detection mantig'i (`auth.ts` → `rotateRefreshToken(raw)`) **raw token stringni** oladi — u tokenning cookie'danmi yoki body'danmi kelganini bilmaydi. Shuning uchun o'zgarish kichik:

**Backend o'zgarishlari (tasdiq kerak — QOIDA: backendni minimal o'zgartirish):**
1. **Client turini aniqlash:** `X-Client: mobile` header (yoki `/api/auth` body'da `client:'mobile'`).
2. **Login/Register/Refresh** — mobil client bo'lsa refresh tokenni **JSON body'da ham** qaytarish (`tokens.refreshToken`), cookie o'rniga/bilan birga.
3. **Refresh endpoint** — cookie yo'q bo'lsa refresh tokenni **body'dan** (`{refreshToken}`) yoki `Authorization`dan o'qish.
4. **Logout** — refresh tokenni body'dan qabul qilish.
- Bu ~1 fayl (`routes/auth.ts`) + cookie helper'ga kичik shart. DB sxemasi **o'zgarmaydi**. Xavfsizlik: mobil'da tokenlar **`expo-secure-store`** (Keychain/Keystore)da saqlanadi.

**Muqobil (backend'ga tegmasdan):** RN'da cookie'ni qo'lda ushlab, `Set-Cookie`'dan `smeta_rt`ni o'qib SecureStore'ga saqlash va `/api/auth/*`ga qo'lda `Cookie` header qo'yish. Ishlaydi, lekin mo'rt (path/SameSite bilan kurashish) — **tavsiya etilmaydi**.

---

## 4. Frontend audit — mobilga tegishlilik

| Web sahifa (`apps/web/src/pages`) | Marshrut | Mobil qarori |
|---|---|---|
| Login | `/kirish` | **Mobil MVP** |
| Dashboard | `/app` | **Mobil MVP** |
| Projects / ProjectDetail | `/app/loyihalar` | **Mobil MVP** |
| Calculator (smeta) | `/app/kalkulyator` | **Mobil MVP** (asosiy qiymat) |
| Materials / MaterialDetail | `/app/materiallar` | **Mobil MVP** |
| Cart / Checkout | `/app/savat`,`/checkout` | **Mobil MVP** (buyurtma, orderId idempotent) |
| Reports | `/app/hisobotlar` | **Mobil MVP** (ko'rish; PDF eksport share-sheet) |
| Settings | `/app/sozlamalar` | **Mobil MVP** (til/valyuta/profil) |
| ChatPage (AI) | `/app/ai` | **Mobil MVP** (SSE stream) |
| Payment (`/tolov/:orderId`) | to'lov | **2-faza** (Payme/Click integratsiyasi hali stub) |
| Sales / Realtors | sotuvlar/maklerlar | **2-faza** (developer/qurilish-sotuv segmenti; MVP'dan keyin) |
| Landing / Legal | `/`,`/privacy`,`/terms` | **Faqat web** (marketing) |
| **admin (`apps/admin`)** butun ilova | — | **Faqat web** |
| Voice (ovozli buyruq, `lib/voice.ts`) | kalkulyator/dashboard ichida | **Mobil MVP** (`expo-av` yozib → `/voice/command`) |

**Foydalanuvchi oqimlari (MVP):** login → dashboard → loyiha ochish → smeta ko'rish/yaratish → material qidirish → savat → buyurtma → bildirishnoma. Til (uz/ru) va valyuta (UZS/USD) har joyda.

---

## 5. i18n va format

- **i18n:** `react-i18next`, `apps/web/src/i18n/{uz,ru}.ts` (+`legal.ts`). Til `localStorage` + URL prefiksi (`/uz`,`/ru`) + profildagi `user.language`. Admin'da ham alohida `apps/admin/src/i18n`.
- **Mobilda qayta ishlatish:** tarjima ob'ektlari oddiy TS obyektlari — ularni **`packages/shared`ga (yoki `packages/i18n`ga) ko'chirib**, ham web ham mobil import qilishi mumkin. Mobilda `i18next` + **`expo-localization`** (qurilma tili) + profildagi `language` bilan boshlang'ich til aniqlanadi. **Kirill (ru) render** — mobil default shriftlar kirillni qo'llaydi; maxsus brend shrift (Inter/Oxanium) qo'shilsa kirill subset tekshiriladi.
- **Valyuta:** `apps/web/src/lib/currency.tsx` — UZS/USD almashtirish, kurs `tenant.usdRate`dan (server). Konvertatsiya mantig'i backendda ham bor (hisobotlar UZS'ga normallashtiriladi). Mobilda `currency.tsx` mantig'i ko'chiriladi (yoki `shared`ga).
- **Sana/son format:** `apps/web/src/lib/format.ts` — mobilda qayta ishlatiladi (`Intl` RN'da mavjud).

---

## 6. Bo'shliqlar ro'yxati (mobil uchun yetishmayotgani)

| # | Bo'shliq | Ta'sir | Taklif (tasdiq kerak) |
|---|---|---|---|
| G1 | **Refresh token cookie-only** | Mobilda auth ishlamaydi | §3 minimal backend o'zgarishi (body'da refresh) |
| G2 | **Push notification endpoint yo'q** | Buyurtma holati/smeta push bo'lmaydi | Expo push token saqlash uchun `POST /api/notifications/register-device` + jo'natishda Expo Push API. DB'ga `DeviceToken` modeli (yangi migratsiya) |
| G3 | **Pagination faqat notifications'da** | Katta ro'yxatlar (materials, sales, projects) to'liq keladi | MVP'da mavjud holicha (ro'yxatlar kichik); 2-fazada `?page/pageSize` qo'shish |
| G4 | **Fayl/rasm yuklash presigned URL yo'q** | avatar/material rasmi faqat URL (endi http(s) validatsiya bilan) | MVP'da URL kiritish; keyin S3/Cloudinary presigned yoki `/upload` endpoint |
| G5 | **PDF/Excel eksport serverda yo'q** | Hisobot eksporti web'da klient-tomon | Mobilda `expo-print`/`expo-sharing` bilan klient PDF, yoki server `/reports/export` (2-faza) |
| G6 | **AI chat SSE** | RN'da native `EventSource` yo'q | `react-native-sse` yoki `fetch`+ReadableStream polyfill; endpoint o'zgarmaydi |
| G7 | **Deep-linking/referral sxemasi** | mobil deep link config kerak | Expo Router + universal links; referral tizimi **hali mavjud emas** (avval backend kerak) |
| G8 | **CORS** | mobil `Origin` yubormaydi | `index.ts` CORS `!origin` bo'lsa ruxsat beradi — mobil so'rovlar o'tadi ✅ (o'zgarish shart emas) |

---

## Xulosa va keyingi qadam

- **Stek aniqlandi:** Express+Prisma+PostgreSQL backend, JWT Bearer + opaque refresh (cookie). Mobil uchun refresh tokenни body orqali berish — yagona zaruriy backend o'zgarishi (G1), push (G2) ixtiyoriy MVP+.
- **Mobil MVP qamrovi:** auth, dashboard, loyihalar, smeta/kalkulyator, materiallar+buyurtma, hisobotlar (ko'rish), sozlamalar, AI chat, ovozli buyruq. Sales/Realtors/Payment — 2-faza. Admin — hech qachon mobil.
- **Umumiy tiplar:** `packages/shared` allaqachon mavjud — mobil shundan foydalanadi.

### ⛔ TO'XTADIM — tasdiqingiz kerak

Iltimos tasdiqlang/tuzating:
1. **Backend o'zgarishi (G1)** — mobil uchun refresh tokenni JSON body'da berishga rozimisiz? (Alternativa: cookie bilan kurashish — mo'rt.)
2. **Push (G2)** — MVP'ga kiritamizmi yoki 2-fazaga? (yangi `DeviceToken` modeli + migratsiya talab qiladi.)
3. **MVP qamrovi** — §4 jadvaldagi "Mobil MVP" ro'yxati to'g'rimi? (masalan Sales/Realtors ni MVP'ga ko'tarish kerakmi?)
4. **Monorepo joylashuvi** — mobil `smeta-ai/apps/mobile/` bo'lsin (bir repo, `shared` tiplar bilan) — rozimisiz?

Tasdiqlagach **2-BOSQICH (arxitektura + skelet loyiha)**ga o'taman.

---

# 2-BOSQICH — ARXITEKTURA (tasdiqlandi)

Tasdiqlangan qarorlar: G1 (refresh body'da) · Push MVP oxirida (alohida tasdiq) · MVP qamrovi §4 · joylashuv `apps/mobile/`.

## Muhit holati (real, tekshirilgan)
| Vosita | Holat |
|---|---|
| Node / npm | v24.16 / 11.13 ✅ |
| Java (Android) | OpenJDK 21 ✅ |
| Expo CLI (`npx expo`) | mavjud ✅ |
| **Android SDK / emulator / adb** | **yo'q** (`ANDROID_HOME` bo'sh) ❌ |
| **iOS Simulator** | Windows — **imkonsiz** ❌ |

➡️ **4-bosqich (ishga tushirish) oqibati:** lokal simulyator/emulyatorda ishga tushirish uchun (a) Android Studio SDK + AVD o'rnatish, yoki (b) **Expo Go + jismoniy qurilma** (eng tez), yoki (c) **EAS Build** (bulutda, iOS uchun ham). Buni 4-bosqichda batafsil qilamiz.

## Texnologiya tanlovi va sabablari
| Qatlam | Tanlov | Sabab |
|---|---|---|
| Framework | **Expo SDK 52 (managed) + TypeScript strict** | OTA update, EAS Build, native modul talab qilinmaydi (voice `expo-av`, secure store, notifications hammasi managed) |
| Navigatsiya | **Expo Router v4** (file-based, bottom tabs + stack) | web'dagi marshrut mantig'iga yaqin, deep-linking built-in (G7) |
| Server state | **TanStack Query v5** (+ persist — offline) | kesh, retry, refetch; offline ko'rish (G) |
| Client state | **Zustand** | yengil auth/til/valyuta holati |
| Formalar | **React Hook Form + Zod** | backend zod sxemalari bilan mos (validatsiyani qayta ishlatish) |
| Styling | **NativeWind v4** (Tailwind) | web Tailwind idiomiga mos; brend token'lari `tailwind.config` |
| API qatlami | **Custom typed fetch client** (interceptor: refresh, xato normallashtirish) | web `lib/api.ts` naqshini takrorlaydi, ortiqcha dependency yo'q |
| Tokenlar | **expo-secure-store** (Keychain/Keystore) | XSS/o'g'irlashdan himoya (web localStorage'dan xavfsizroq) |
| Kesh | AsyncStorage (Query persist) | offline qoralama/ko'rish |
| i18n | **i18next + react-i18next + expo-localization** | web tarjimalarini qayta ishlatish |

## Papka strukturasi (`apps/mobile/`)
```
app/                      # Expo Router marshrutlari
  _layout.tsx             # Providers: Query, i18n, Theme, Auth-gate
  index.tsx               # auth holatiga qarab redirect
  (auth)/login.tsx
  (tabs)/_layout.tsx      # bottom tabs
  (tabs)/index.tsx        # Dashboard
src/
  theme/tokens.ts         # brend ranglari (#0F3473,#5555E7,#F6F4F1), spacing, radius
  lib/env.ts              # EXPO_PUBLIC_API_URL (+ Android 10.0.2.2)
  lib/api/client.ts       # typed fetch + refresh interceptor + xato normallashtirish
  lib/auth/tokenStore.ts  # expo-secure-store (access+refresh)
  lib/auth/authStore.ts   # zustand (user/tenant/role)
  lib/query.ts            # QueryClient (+persist)
  i18n/{index,uz,ru}.ts
config: app.config.ts, tsconfig.json, babel.config.js, metro.config.js,
        tailwind.config.js, global.css, .env.example
```

## Monorepo integratsiyasi (mavjud apps'ni buzmasdan)
- `apps/mobile` **root `workspaces`ga qo'shilmaydi** (Expo/RN hoisting mavjud web/api lockfile'ini destabilizatsiya qilmasligi uchun) — **mustaqil paket**, o'z `node_modules`i bilan.
- `@smeta/shared` tiplari **tsconfig `paths`** orqali (`../../packages/shared/src`) — compile-time, runtime resolutsiya shart emas (faqat `import type`).
- Runtime qiymatlar (masalan `PLAN_PRICES`) kerak bo'lsa — Metro `watchFolders` + `extraNodeModules` bilan ulanadi (skeletda tayyorlab qo'yiladi).

## Backend o'zgarishlari (G1) — 3-bosqichda, ALOHIDA tasdiq bilan
`routes/auth.ts` da: `X-Client: mobile` header bo'lsa login/register/refresh javobida `tokens.refreshToken` ham qaytadi; refresh/logout cookie yo'q bo'lsa body'dan (`{refreshToken}`) o'qiydi. DB sxemasi **o'zgarmaydi** (`rotateRefreshToken(raw)` allaqachon string oladi).

**Skelet yaratildi → keyin `npm install` + `tsc` typecheck → 3-bosqich (MVP funksiyalari).**
