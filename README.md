# 🏗️ Smeta AI

Qurilish smetalarini **AI yordamida** hisoblovchi to'liq SaaS platforma. O'zbekiston bozori uchun (o'zbek tili, lotin).

Bu monorepo Visily'dan eksport qilingan 9 ta ekrandan yagona, ishlaydigan mahsulot yaratadi:

| Ilova | Tavsif | Port |
|---|---|---|
| **`apps/web`** | Mijoz ilovasi — landing, kirish, dashboard, kalkulyator, materiallar katalogi, loyihalar, hisobotlar, sozlamalar, **AI Chat** | 5173 |
| **`apps/admin`** | **Sizning admin panelingiz** — mijozlar (tenant), obunalar, hisob-fakturalar, statistika boshqaruvi | 5174 |
| **`apps/api`** | Backend — Express + Prisma + PostgreSQL, JWT auth, REST API, **real Claude AI** chat | 4000 |
| **`packages/shared`** | Umumiy TypeScript tiplar (API kontrakt) va dizayn tokenlari | — |

## Texnologiyalar

- **Frontend:** React 19, Vite 7, Tailwind CSS v4, Iconify, React Router 7
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL, JWT, bcrypt, Zod
- **AI:** Anthropic Claude (`@anthropic-ai/sdk`) — streaming chat (`claude-opus-4-8`)

---

## 🚀 Tez ishga tushirish (lokal)

Talab: **Node 20+**, **Docker** (lokal Postgres uchun).

```bash
cd smeta-ai

# 1. .env faylini tayyorlang
cp .env.example .env
#   (ANTHROPIC_API_KEY ni qo'shing — bo'lmasa AI chat demo rejimida ishlaydi)

# 2. Bog'liqliklarni o'rnating
npm install

# 3. Umumiy paketni build qiling
npm run build -w @smeta/shared

# 4. PostgreSQL'ni ko'taring (Docker)
npm run db:up

# 5. Migratsiya + demo ma'lumotlar
npm run db:migrate
npm run db:seed

# 6. Hammasini birga ishga tushiring (api + web + admin)
npm run dev
```

So'ng oching:
- **Mijoz ilovasi:** http://localhost:5173
- **Admin panel:** http://localhost:5174
- **API:** http://localhost:4000/api/health

### Demo kirish ma'lumotlari

| Kim | Manzil | Email | Parol |
|---|---|---|---|
| Mijoz (foydalanuvchi) | :5173/kirish | `j.abduvoxidov@smeta.ai` | `demo1234` |
| Administrator | :5174/kirish | `admin@smeta.ai` | `admin1234` |

---

## 📦 Deploy (Railway / Render)

`render.yaml` blueprint API, web va admin'ni hamda boshqariladigan PostgreSQL'ni belgilaydi.

1. Repozitoriyni GitHub'ga yuklang.
2. Render'da **New → Blueprint** → repozitoriyni tanlang → `render.yaml` avtomatik o'qiladi.
3. Quyidagi maxfiy o'zgaruvchilarni qo'ling:
   - `ANTHROPIC_API_KEY` (smeta-api)
   - `WEB_ORIGIN`, `ADMIN_ORIGIN` (smeta-api) — frontend URL manzillari
   - `VITE_API_URL` (smeta-web, smeta-admin) — smeta-api URL manzili
4. Deploy. Migratsiya va seed birinchi ishga tushishda avtomatik bajariladi.

> Railway uchun: har bir ilovani alohida service sifatida yarating, build/start buyruqlarini `render.yaml` dan oling.

---

## 🗂️ Loyiha tuzilishi

```
smeta-ai/
├─ apps/
│  ├─ api/         Express + Prisma backend
│  │  ├─ prisma/   schema.prisma, seed.ts
│  │  └─ src/      routes/, auth, config, server
│  ├─ web/         Mijoz ilovasi (React)
│  │  └─ src/      pages/, components/, lib/
│  └─ admin/       Admin panel (React)
├─ packages/shared/  Umumiy tiplar
├─ docker-compose.yml
├─ render.yaml
└─ .env.example
```

## 🔌 Asosiy API endpointlari

```
POST /api/auth/register | login | refresh        — mijoz auth
GET  /api/dashboard                               — dashboard agregatlari
GET  /api/projects  POST /api/projects            — loyihalar
GET  /api/materials                               — materiallar katalogi
POST /api/estimates/calc  POST /api/estimates     — smeta hisoblash/saqlash
GET  /api/reports                                 — tahliliy hisobotlar
POST /api/ai/chat                                 — Claude AI chat (SSE stream)
POST /api/admin/auth/login                        — admin auth
GET  /api/admin/stats | tenants | invoices | users — admin boshqaruv
PATCH /api/admin/tenants/:id                      — tarif/holat o'zgartirish
```

---

© 2026 Smeta AI. Qurilish hisob-kitoblarining kelajagi.
