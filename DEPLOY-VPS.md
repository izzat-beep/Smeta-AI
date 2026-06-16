# 🚀 Contabo / VPS'ga deploy (Docker)

Hammasi bitta `docker compose` bilan: API + web + admin + PostgreSQL + Caddy (avtomatik HTTPS).

## 1. Domen DNS
Domeningizda 2 ta **A record** yarating (har ikkalasi VPS IP'siga):
```
@      A   <VPS_IP>     →  smeta.uz       (mijoz ilovasi)
admin  A   <VPS_IP>     →  admin.smeta.uz (admin panel)
```

## 2. VPS tayyorlash (Ubuntu 24.04)
SSH bilan kiring va Docker o'rnating:
```bash
curl -fsSL https://get.docker.com | sh
```

## 3. Loyihani olish va sozlash
```bash
git clone <SIZNING_REPO_URL> smeta-ai
cd smeta-ai
cp .env.prod.example .env
nano .env          # DOMAIN, ACME_EMAIL, parollar, ANTHROPIC_API_KEY ni to'ldiring
```

## 4. Ishga tushirish
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
Bir necha daqiqada Caddy avtomatik bepul SSL oladi. Tayyor:
- **https://smeta.uz** — mijoz ilovasi
- **https://admin.smeta.uz** — admin (`admin@smeta.ai` / `admin1234`)

> Admin paroli birinchi ishga tushishda yaratiladi. O'zgartirish: `.env` ga `ADMIN_EMAIL` / `ADMIN_PASSWORD` qo'shing.

## 5. (Ixtiyoriy) Demo ma'lumot qo'shish
```bash
docker compose -f docker-compose.prod.yml exec api npm run db:seed -w @smeta/api
```

## Foydali buyruqlar
```bash
docker compose -f docker-compose.prod.yml logs -f api   # loglar
docker compose -f docker-compose.prod.yml down           # to'xtatish
docker compose -f docker-compose.prod.yml up -d --build  # yangilash (git pull dan keyin)
```

## Eslatma
- Portlar **80** va **443** ochiq bo'lsin (Contabo firewall / ufw).
- Postgres ma'lumotlari `pgdata` volume'da saqlanadi — qayta ishga tushirishda yo'qolmaydi.
- Lokal `embedded-postgres` va `render.yaml` bu yerda ishlatilmaydi — VPS haqiqiy Postgres'dan foydalanadi.
