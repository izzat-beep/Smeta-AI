#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Smeta AI — ishonchli production deploy (VPS).
#
#  Muammoni hal qiladi: deploy'dan keyin eski (cached) build ko'rinishi yoki
#  "ma'lumotlar o'chib ketgandek" effekti.
#
#  MUHIM: bu skript HECH QACHON `down -v` ishlatmaydi. `-v` flagi nomli
#  volume'larni (pgdata) o'chiradi va PostgreSQL ma'lumotlari butunlay yo'qoladi.
#  Ma'lumotlar bazasi `pgdata` volume'da saqlanadi va deploy'lar oralig'ida
#  saqlanib qoladi.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")"
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> 1/5  Yangi kodni olish (git pull)"
git pull --ff-only || echo "    (git pull o'tkazib yuborildi — qo'lda yangilangan bo'lishi mumkin)"

echo "==> 2/5  Eski konteynerlarni to'xtatish va o'chirish (volume'larga TEGILMAYDI)"
$COMPOSE down --remove-orphans

echo "==> 3/5  Image'larni noldan qurish (--no-cache — eski build qolmasin)"
# Build vaqtida 'prisma generate' avtomatik ishlaydi (apps/api/Dockerfile).
$COMPOSE build --no-cache

echo "==> 4/5  Yangi konteynerlarni ko'tarish"
# API konteyneri ishga tushganda 'prisma migrate deploy' (yangi migratsiyalar) +
# idempotent bootstrap'ni avtomatik bajaradi.
$COMPOSE up -d

echo "==> 5/5  Holat va migratsiya loglari"
$COMPOSE ps
echo ""
echo "✓ Deploy tugadi."
echo "  API loglari:   $COMPOSE logs --tail=100 -f api"
echo "  DB volume:     'pgdata' (saqlanib qoladi — qayta deploy'da yo'qolmaydi)"
