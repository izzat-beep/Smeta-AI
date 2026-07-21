# Monitoring va anomaliya alertlari (pentest To'lqin 3)

Ilova allaqachon strukturali log yozadi (`console.warn/error`): muvaffaqiyatsiz
login, CORS rad, admin-auth, `[audit]`, `[cleanup]`, `[push]`. Docker `json-file`
yoki `journald` orqali yig'iladi.

## Alert qoidalari (biznes-mantiqiy anomaliyalar)
| Signal | Manba (log qidiruv) | Ostona | Harakat |
|--------|---------------------|--------|---------|
| Brute-force | `Muvaffaqiyatsiz login` | ≥20 / 5 daq / IP | fail2ban ban + alert |
| Account lockout to'lqini | `account_locked` | ≥10 / 5 daq | tekshirish |
| CORS skan | `[CORS] Rad etildi` | ≥50 / 5 daq | IP bloklash |
| Kutilmagan admin yaratish | `AuditLog.action='admin.user.create'` | har biri | darhol alert (kam bo'lishi kerak) |
| Vendor blok/parol-reset | `admin.vendor.block` | anomaliya | ko'rib chiqish |
| 5xx spike | `[API error]` / `[ai/chat]` | ≥1% so'rov | eskalatsiya |
| AI cost | `ai_daily_limit`/`ai_hourly_limit` | tez-tez | limit/tarif ko'rib chiqish |

## Yengil stek (VPS uchun)
- **Promtail + Loki + Grafana** (yoki **Vector**) — Docker loglarини yig'ish + alert.
- Yoki minimal: `journalctl` + `fail2ban` + kunlik audit-digest skript
  (`SELECT action, count(*) FROM "AuditLog" WHERE createdAt > now()-interval '1 day' GROUP BY 1`)
  → email/Telegram.
- **Uptime:** tashqi monitor (`GET /api/health`) — 200 va `time` yangiligi.

## Audit-log ko'rish (SQL)
```sql
SELECT "createdAt","actorKind","actorId","action","targetType","targetId","ip","meta"
FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 100;
```
