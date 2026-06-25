#!/usr/bin/env bash
# Aplica sendfile off em /assets/ no Nginx do servidor Templários.
# Uso: executado via SSH no deploy (CI). Não altera SSL nem server_name.
set -euo pipefail

LIVE_ROOT="${1:-/var/www/templarios}"

CONF=""
for dir in /etc/nginx/sites-enabled /etc/nginx/conf.d; do
  if [ -d "$dir" ]; then
    CONF=$(grep -rl "root ${LIVE_ROOT}" "$dir" 2>/dev/null | head -1 || true)
    [ -n "$CONF" ] && break
  fi
done

if [ -z "$CONF" ]; then
  CONF=$(grep -rl 'templariosdapazoficial' /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null | head -1 || true)
fi

if [ -z "$CONF" ]; then
  echo "Aviso: config Nginx do site não encontrada; patch ignorado."
  exit 0
fi

echo "Config Nginx alvo: $CONF"
sudo cp "$CONF" "${CONF}.bak-deploy"

ASSETS_BLOCK='    location /assets/ {
        sendfile off;
        aio off;
        directio off;
        tcp_nopush off;
        gzip on;
        gzip_vary on;
        gzip_types application/javascript text/css;
        gzip_min_length 256;
        add_header Cache-Control "no-cache, must-revalidate";
        try_files $uri =404;
    }'

if grep -q 'location /assets/' "$CONF"; then
  echo "Atualizando location /assets/ existente..."
  sudo python3 - "$CONF" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path).read()
new_block = """    location /assets/ {
        sendfile off;
        aio off;
        directio off;
        tcp_nopush off;
        gzip on;
        gzip_vary on;
        gzip_types application/javascript text/css;
        gzip_min_length 256;
        add_header Cache-Control "no-cache, must-revalidate";
        try_files $uri =404;
    }"""
pattern = r'    location /assets/ \{.*?\n    \}'
if not re.search(pattern, text, flags=re.DOTALL):
    print("location /assets/ não encontrado no formato esperado")
    sys.exit(1)
text = re.sub(pattern, new_block, text, count=1, flags=re.DOTALL)
open(path, 'w').write(text)
print("location /assets/ atualizado.")
PY
else
  echo "Inserindo location /assets/ antes de location /..."
  sudo python3 - "$CONF" <<'PY'
import sys
path = sys.argv[1]
text = open(path).read()
block = """
    location /assets/ {
        sendfile off;
        aio off;
        directio off;
        tcp_nopush off;
        gzip on;
        gzip_vary on;
        gzip_types application/javascript text/css;
        gzip_min_length 256;
        add_header Cache-Control "no-cache, must-revalidate";
        try_files $uri =404;
    }
"""
marker = "    location / {"
if marker not in text:
    print("location / não encontrado")
    sys.exit(1)
text = text.replace(marker, block + "\n" + marker, 1)
open(path, 'w').write(text)
print("location /assets/ inserido.")
PY
fi

if ! sudo nginx -t; then
  echo "nginx -t falhou; restaurando backup."
  sudo cp "${CONF}.bak-deploy" "$CONF"
  sudo nginx -t
  exit 1
fi

sudo systemctl reload nginx
echo "Nginx recarregado com sendfile off em /assets/."
