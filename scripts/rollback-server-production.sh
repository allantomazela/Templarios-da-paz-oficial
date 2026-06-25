#!/usr/bin/env bash
# Rollback de emergência no servidor Vultr — restaura site + nginx estável.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIVE="/var/www/templarios"
OLD="/var/www/templarios.old"
BROKEN="/var/www/templarios.broken"
LEGACY="/var/www/templarios-assets-legacy"
NGINX_SRC="${1:-${SCRIPT_DIR}/../docs/nginx-templarios-stable.conf}"
NGINX_TARGET="/etc/nginx/sites-available/templarios"

echo "========== ROLLBACK PRODUÇÃO =========="

if [ ! -f "$NGINX_SRC" ]; then
  NGINX_SRC="/tmp/nginx-templarios-stable.conf"
fi
if [ ! -f "$NGINX_SRC" ]; then
  echo "ERRO: nginx-templarios-stable.conf não encontrado"
  exit 1
fi

if [ -d "$OLD" ] && [ -f "$OLD/index.html" ]; then
  echo "Restaurando arquivos de $OLD -> $LIVE"
  rm -rf "$BROKEN"
  [ -d "$LIVE" ] && mv "$LIVE" "$BROKEN"
  cp -a "$OLD" "$LIVE"
else
  echo "AVISO: $OLD não encontrado; mantendo $LIVE atual"
fi

if [ -d "$LEGACY" ]; then
  echo "Mesclando assets legados..."
  mkdir -p "$LIVE/assets"
  cp -a --update=none "$LEGACY/." "$LIVE/assets/" 2>/dev/null || true
fi

chown -R www-data:www-data "$LIVE"

echo "Aplicando Nginx estável..."
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
systemctl restart nginx

MAIN=$(grep -oE 'src="/assets/index-[^"]+\.js"' "$LIVE/index.html" | head -1 | sed 's/.*\/assets\///;s/"//')
echo "Bundle ativo: $MAIN"

curl -4 -k -sS -o /tmp/rollback-local.js -w "LOCAL: %{http_code} %{size_download}\n" --max-time 60 \
  -H 'Host: www.templariosdapazoficial.com.br' "https://127.0.0.1/assets/$MAIN" || true

curl -4 --http1.1 -sS -o /tmp/rollback-ext.js -w "EXTERNO: %{http_code} %{size_download}\n" --max-time 60 \
  "https://www.templariosdapazoficial.com.br/assets/$MAIN" || true

echo "========== ROLLBACK CONCLUÍDO =========="
