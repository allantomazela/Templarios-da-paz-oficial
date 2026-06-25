#!/usr/bin/env bash
# Corrige ERR_CONNECTION_RESET: desliga sendfile no site Templários (Vultr/nginx).
set -euo pipefail

LIVE_ROOT="${1:-/var/www/templarios}"
PATCHED=0

shopt -s nullglob
for conf in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do
  [ -f "$conf" ] || continue
  if ! grep -q "root ${LIVE_ROOT}" "$conf" 2>/dev/null; then
    continue
  fi

  echo "Patch em: $conf"
  cp "$conf" "${conf}.bak-deploy"

  sed -i 's/sendfile[[:space:]]*on;/sendfile off;/g' "$conf"

  if ! grep -q 'sendfile' "$conf"; then
    sed -i "s|root ${LIVE_ROOT};|root ${LIVE_ROOT};\n    sendfile off;|" "$conf"
  fi

  if ! grep -q 'location /assets/' "$conf"; then
    sed -i "s|    location / {|    location /assets/ {\n        sendfile off;\n        try_files \$uri =404;\n    }\n\n    location / {|" "$conf"
  fi

  PATCHED=$((PATCHED + 1))
done

if [ "$PATCHED" -eq 0 ]; then
  echo "::error::Nenhum arquivo nginx com root ${LIVE_ROOT} encontrado."
  exit 1
fi

echo "Arquivos patchados: $PATCHED"

if ! nginx -t 2>&1; then
  echo "nginx -t falhou; restaurando backups."
  for conf in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do
    [ -f "${conf}.bak-deploy" ] && cp "${conf}.bak-deploy" "$conf"
  done
  nginx -t
  exit 1
fi

systemctl reload nginx
echo "Nginx recarregado com sendfile off."
