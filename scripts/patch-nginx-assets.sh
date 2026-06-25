#!/usr/bin/env bash
# Corrige ERR_CONNECTION_RESET: desliga sendfile no site Templários (Vultr/nginx).
set -euo pipefail

LIVE_ROOT="${1:-/var/www/templarios}"
PATCHED=0

patch_file() {
  local conf="$1"
  echo "Patch em: $conf"
  cp "$conf" "${conf}.bak-deploy"

  sed -i 's/sendfile[[:space:]]*on;/sendfile off;/g' "$conf"

  if grep -qE "root[[:space:]]+${LIVE_ROOT}" "$conf" && ! grep -q 'sendfile' "$conf"; then
    sed -i "s|root ${LIVE_ROOT};|root ${LIVE_ROOT};\n    sendfile off;|" "$conf"
  fi

  if grep -qE "root[[:space:]]+${LIVE_ROOT}" "$conf" && ! grep -q 'location /assets/' "$conf"; then
    sed -i "s|    location / {|    location /assets/ {\n        sendfile off;\n        try_files \$uri =404;\n    }\n\n    location / {|" "$conf"
  fi

  PATCHED=$((PATCHED + 1))
}

shopt -s nullglob

# 1) Arquivos com root explícito do site
for conf in /etc/nginx/sites-enabled/* /etc/nginx/sites-available/* /etc/nginx/conf.d/*.conf; do
  [ -f "$conf" ] || continue
  if grep -qE "root[[:space:]]+${LIVE_ROOT}" "$conf" 2>/dev/null; then
    patch_file "$conf"
  fi
done

# 2) Arquivos que mencionam o domínio (root pode estar em include/snippet)
if [ "$PATCHED" -eq 0 ]; then
  while IFS= read -r conf; do
    [ -f "$conf" ] || continue
    patch_file "$conf"
  done < <(grep -rl 'templariosdapazoficial' /etc/nginx 2>/dev/null || true)
fi

# 3) sendfile global no nginx.conf (alguns VPS só têm isso)
if grep -q 'sendfile[[:space:]]*on' /etc/nginx/nginx.conf 2>/dev/null; then
  echo "Patch em: /etc/nginx/nginx.conf (sendfile global)"
  cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak-deploy
  sed -i 's/sendfile[[:space:]]*on;/sendfile off;/g' /etc/nginx/nginx.conf
  PATCHED=$((PATCHED + 1))
fi

if [ "$PATCHED" -eq 0 ]; then
  echo "ERRO: Nenhuma config nginx encontrada."
  echo "Execute no servidor:"
  echo "  grep -r templarios /etc/nginx/"
  echo "  grep -r 'root ' /etc/nginx/"
  echo "  ls -la /var/www/"
  exit 1
fi

echo "Arquivos patchados: $PATCHED"

if ! nginx -t 2>&1; then
  echo "nginx -t falhou; restaurando backups."
  find /etc/nginx -name '*.bak-deploy' 2>/dev/null | while read -r bak; do
    orig="${bak%.bak-deploy}"
    [ -f "$bak" ] && cp "$bak" "$orig"
  done
  nginx -t
  exit 1
fi

systemctl reload nginx
echo "Nginx recarregado com sendfile off."

# Teste local
curl -4 -sS -o /tmp/templarios-test.html -w "index local: HTTP %{http_code} bytes=%{size_download}\n" --max-time 30 \
  -H 'Host: www.templariosdapazoficial.com.br' http://127.0.0.1/ || true
