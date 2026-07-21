# PostgreSQL hardening (pentest To'lqin 3)

## 1. Least-privilege runtime roli
Hozir ilova `smeta` (owner) sifatida ulanadi. Ikki-rol naqshi:
**migratsiya** → owner (DDL); **runtime** → faqat CRUD.

```sql
-- deploy/postgres/01-least-priv.sql  (owner sifatida bir marta bajaring)
CREATE ROLE smeta_app LOGIN PASSWORD 'RUNTIME_STRONG_PASSWORD';
GRANT CONNECT ON DATABASE smeta TO smeta_app;
GRANT USAGE ON SCHEMA public TO smeta_app;
-- Mavjud va kelajakdagi jadvallarga faqat CRUD (DDL yo'q):
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO smeta_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO smeta_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO smeta_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO smeta_app;
-- AuditLog append-only: UPDATE/DELETE ni MAN qilamiz (immutability).
REVOKE UPDATE, DELETE ON "AuditLog" FROM smeta_app;
```
`.env`:
```
DATABASE_URL=postgresql://smeta_app:...@db:5432/smeta?schema=public&sslmode=require
DIRECT_DATABASE_URL=postgresql://smeta:...@db:5432/smeta   # migratsiya uchun (owner)
```
> **BREAKING:** Prisma `migrate deploy` DDL uchun owner URL kerak. `schema.prisma`
> `directUrl = env("DIRECT_DATABASE_URL")` qo'shing; runtime `url` = smeta_app.

## 2. SSL majburiy
`postgresql.conf`: `ssl = on` (sertifikat: `ssl_cert_file`, `ssl_key_file`).
`pg_hba.conf` — faqat SSL, ichki tarmoq:
```
hostssl  smeta  smeta_app  10.0.0.0/8   scram-sha-256
hostssl  smeta  smeta      10.0.0.0/8   scram-sha-256
# 'host' (SSL-siz) qatorlarni O'CHIRING. Tashqi (0.0.0.0/0) YO'Q.
```
> Docker'da `db` porti tashqariga **ochilmagan** (prod compose ✅) — DB faqat
> ichki tarmoqда.

## 3. Backup — 3-2-1 (shifrlangan) + restore test
`deploy/backup.sh` (cron: `0 3 * * *`). age (yoki gpg) bilan shifrlash.
Restore-test oyiga bir marta — backup yaroqliligini tasdiqlaydi.
