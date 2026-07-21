#!/usr/bin/env bash
# Smeta AI — Contabo/Ubuntu 24.04 VPS bazaviy hardening.
# ROOT sifatida ishga tushiring: sudo bash deploy/harden.sh
# MUHIM: SSH portini o'zgartirishdan OLDIN key-based kirish ishlashini tekshiring
# (aks holda o'zingizni bloklab qo'yasiz!).
set -euo pipefail

SSH_PORT="${SSH_PORT:-2222}"   # non-standard SSH port

echo "==> 1/5  Paketlar"
apt-get update -y
apt-get install -y ufw fail2ban unattended-upgrades

echo "==> 2/5  UFW (default deny incoming)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow "${SSH_PORT}"/tcp comment 'SSH (non-standard)'
ufw allow 80/tcp comment 'HTTP (ACME + redirect)'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 443/udp comment 'HTTP/3 QUIC'
ufw --force enable
ufw status verbose

echo "==> 3/5  SSH qattiqlashtirish (key-only, root yo'q, non-standard port)"
SSHD=/etc/ssh/sshd_config.d/99-hardening.conf
cat > "$SSHD" <<EOF
Port ${SSH_PORT}
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
PubkeyAuthentication yes
X11Forwarding no
MaxAuthTries 3
LoginGraceTime 20
AllowTcpForwarding no
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
echo "    (Tekshiring: sizda 'deploy' foydalanuvchi + ~/.ssh/authorized_keys borligiga ISHONCH hosil qiling)"
sshd -t && systemctl reload ssh || echo "    ⚠️ sshd config xatosi — reload o'tkazib yuborildi"

echo "==> 4/5  fail2ban (SSH + Caddy 401/403 jail)"
cp "$(dirname "$0")/fail2ban-jail.local" /etc/fail2ban/jail.local
# Caddy log filtri (agar Caddy JSON access-log yozsa).
cat > /etc/fail2ban/filter.d/caddy-auth.conf <<'EOF'
[Definition]
failregex = ^.*"remote_ip":"<HOST>".*"status":(401|403).*$
ignoreregex =
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

echo "==> 5/5  Avtomatik xavfsizlik yangilanishlari"
dpkg-reconfigure -f noninteractive unattended-upgrades || true

echo "✓ Hardening tugadi. SSH endi ${SSH_PORT} portida. UFW faol. fail2ban ishlayapti."
echo "  Tekshiring: 'ss -tlnp', 'ufw status', 'fail2ban-client status'."
