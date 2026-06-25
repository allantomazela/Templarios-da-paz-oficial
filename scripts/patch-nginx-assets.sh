#!/usr/bin/env bash
# Corrige ERR_CONNECTION_RESET: desliga sendfile no site Templários (Vultr/nginx).
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
  echo "::error::Config Nginx do site não encontrada."
  exit 1
fi

echo "Config Nginx alvo: $CONF"
sudo cp "$CONF" "${CONF}.bak-deploy"

sudo python3 - "$CONF" "$LIVE_ROOT" <<'PY'
import re, sys

path, live_root = sys.argv[1], sys.argv[2]
text = open(path).read()

# Desliga sendfile no server block que serve o site (HEAD 200 + GET reset no Vultr).
blocks = list(re.finditer(r"server\s*\{", text))
patched = False
for m in blocks:
    start = m.start()
    depth = 0
    end = None
    for i in range(m.start(), len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end is None:
        continue
    block = text[start:end]
    if live_root not in block and "templariosdapazoficial" not in block:
        continue
    new_block = re.sub(r"sendfile\s+on\s*;", "sendfile off;", block)
    new_block = re.sub(r"sendfile\s+off\s*;", "sendfile off;", new_block)
    if "sendfile" not in new_block:
        new_block = new_block.replace("index index.html;", "index index.html;\n    sendfile off;", 1)
    assets = """    location /assets/ {
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
    if "location /assets/" in new_block:
        new_block = re.sub(
            r"    location /assets/ \{.*?\n    \}",
            assets.strip(),
            new_block,
            count=1,
            flags=re.DOTALL,
        )
    elif "    location / {" in new_block:
        new_block = new_block.replace("    location / {", assets + "\n    location / {", 1)
    text = text[:start] + new_block + text[end:]
    patched = True
    break

if not patched:
    print("Nenhum server block do Templários encontrado para patch.")
    sys.exit(1)

open(path, "w").write(text)
print("Patch Nginx aplicado com sucesso.")
PY

if ! sudo nginx -t 2>&1; then
  echo "nginx -t falhou; restaurando backup."
  sudo cp "${CONF}.bak-deploy" "$CONF"
  exit 1
fi

sudo systemctl reload nginx
echo "Nginx recarregado."
