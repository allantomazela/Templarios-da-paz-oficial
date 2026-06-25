#!/usr/bin/env bash
# Aplica apenas Nginx estável (não altera /var/www/templarios).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NGINX_SRC="${1:-${SCRIPT_DIR}/../docs/nginx-templarios-stable.conf}"
NGINX_TARGET="/etc/nginx/sites-available/templarios"

if [ ! -f "$NGINX_SRC" ]; then
  NGINX_SRC="/tmp/nginx-templarios-stable.conf"
fi
if [ ! -f "$NGINX_SRC" ]; then
  echo "ERRO: nginx-templarios-stable.conf não encontrado"
  exit 1
fi

cp "$NGINX_SRC" "$NGINX_TARGET"
ln -sf "$NGINX_TARGET" /etc/nginx/sites-enabled/templarios
rm -f /etc/nginx/sites-enabled/templariosdapazoficial.com.br
rm -f /etc/nginx/sites-enabled/*.bak-http2*

for conf in /etc/nginx/sites-enabled/* /etc/nginx/nginx.conf; do
  [ -f "$conf" ] || continue
  sed -i 's/listen \(.*\) ssl http2;/listen \1 ssl;/g' "$conf" 2>/dev/null || true
  sed -i 's/listen \(.*\) http2;/listen \1;/g' "$conf" 2>/dev/null || true
done

if grep -q 'sendfile[[:space:]]*on' /etc/nginx/nginx.conf 2>/dev/null; then
  sed -i 's/sendfile[[:space:]]*on;/sendfile off;/g' /etc/nginx/nginx.conf
fi

nginx -t
systemctl reload nginx
echo "Nginx estável aplicado."
