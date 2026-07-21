#!/usr/bin/env bash
# Smeta AI — PostgreSQL 3-2-1 shifrlangan backup (pentest To'lqin 3).
# Cron: 0 3 * * *  bash /opt/smeta-ai/deploy/backup.sh
# Talab: age (shifrlash), rclone (offsite, ixtiyoriy).
#   age-keygen -o /root/.smeta-backup.key   # bir marta; PUBLIC key'ni pastga qo'ying
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-smeta-db}"
AGE_PUBKEY="${AGE_PUBKEY:-age1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/smeta}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR}/smeta-${STAMP}.sql.age"

mkdir -p "$BACKUP_DIR"

echo "==> dump + shifrlash"
# 2 nusxa (lokal) — offsite (rclone) 3-chi nusxa.
docker exec -e PGPASSWORD="${DB_PASSWORD}" "$DB_CONTAINER" \
  pg_dump -U smeta -d smeta --no-owner --clean \
  | age -r "$AGE_PUBKEY" -o "$OUT"

echo "==> lokal retention (${RETENTION_DAYS} kun)"
find "$BACKUP_DIR" -name 'smeta-*.sql.age' -mtime +"$RETENTION_DAYS" -delete

# 3-2-1: offsite nusxa (S3/B2/boshqa VPS). rclone remote'ni sozlang.
if command -v rclone >/dev/null; then
  echo "==> offsite (rclone)"
  rclone copy "$OUT" "${RCLONE_REMOTE:-smeta-offsite:smeta-backups}/" || echo "  ⚠️ offsite xato"
fi

echo "✓ Backup: $OUT ($(du -h "$OUT" | cut -f1))"
echo "  Restore-test (oyiga bir marta):"
echo "    age -d -i /root/.smeta-backup.key $OUT | docker exec -i smeta-db psql -U smeta -d smeta_restore_test"
