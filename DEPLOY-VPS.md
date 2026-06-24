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

## Yangilash (deploy)
Har bir update'da quyidagi skriptni ishga tushiring — u eski konteynerlarni
to'xtatadi, image'larni noldan quradi (`--no-cache`), migratsiyalarni qo'llaydi
va yangi konteynerlarni ko'taradi:
```bash
bash deploy.sh
```

## Foydali buyruqlar
```bash
docker compose -f docker-compose.prod.yml logs -f api   # loglar
docker compose -f docker-compose.prod.yml down          # to'xtatish (ma'lumot saqlanadi)
bash deploy.sh                                          # to'liq yangilash
```

## ⚠️ Ma'lumotlar bazasi haqida — MUHIM
- Postgres ma'lumotlari `pgdata` nomli volume'da saqlanadi — qayta ishga
  tushirish va deploy'larda **yo'qolmaydi**.
- **HECH QACHON `docker compose down -v` ishlatmang!** `-v` flagi `pgdata`
  volume'ni o'chiradi va barcha mijoz ma'lumotlari butunlay yo'qoladi
  ("ma'lumotlar o'chib ketdi" muammosining asosiy sababi).
- Frontend (web/admin) `index.html` keshlanmaydi (nginx `no-cache`), shuning
  uchun deploy'dan keyin foydalanuvchilar avtomatik eng yangi versiyani oladi.

## Eslatma
- Portlar **80** va **443** ochiq bo'lsin (Contabo firewall / ufw).
- Lokal `embedded-postgres` va `render.yaml` bu yerda ishlatilmaydi — VPS haqiqiy Postgres'dan foydalanadi.
