# deploy/ — VPS hardening (Contabo/Ubuntu 24.04)

Pentest-audit To'lqin 1 infra qismi. Fayllar:

| Fayl | Nima |
|------|------|
| `../Caddyfile` | TLS 1.2+ (1.3-only opsiyasi), HSTS preload, xavfsizlik headerlari, `-Server`, HTTP/3 |
| `harden.sh` | UFW (default deny), SSH (key-only, root yo'q, port 2222), fail2ban, auto-updates |
| `fail2ban-jail.local` | sshd + Caddy 401/403 jail |
| `docker-compose.hardened.yml` | no-new-privileges, cap_drop ALL, read-only fs, resurs limitlari |

## Qo'llash (bosqichma-bosqich)
```bash
# 1) VPS hardening (ROOT, SSH key ishlashiga ISHONCH hosil qilgach!)
sudo SSH_PORT=2222 bash deploy/harden.sh

# 2) Hardened Docker stack
docker compose -f docker-compose.prod.yml -f deploy/docker-compose.hardened.yml up -d --build

# 3) Caddy access-log (fail2ban caddy-auth jail uchun) — Caddyfile'ga qo'shing:
#    log { output file /var/log/caddy/access.log }
```

## ⚠️ Breaking / ehtiyot
- **SSH port 2222 + key-only:** parol bilan kirish o'chadi. Avval `deploy` foydalanuvchi
  + `~/.ssh/authorized_keys` borligini, va yangi portда ulanishни tekshiring.
- **HSTS preload:** `hstspreload.org` ga yuborish — qaytmas. Avval barcha subdomenlar HTTPS.
- **read_only fs:** ilova diskка yozsa buziladi — API xotirada ishlaydi (fayl saqlamaydi),
  nginx cache tmpfs'da. Muammo bo'lsa `read_only`ni o'chiring.
- **TLS 1.3-only:** eski qurilmalar uziladi — default 1.2+; kerak bo'lsa Caddyfile'da o'zgartiring.

## Qolgan (To'lqin 3)
PostgreSQL SSL + least-priv rol, 3-2-1 shifrlangan backup + restore-test, monitoring/alert.
