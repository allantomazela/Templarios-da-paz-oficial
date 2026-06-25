#!/usr/bin/env bash
# Corrige ERR_CONNECTION_RESET: desliga sendfile em TODOS os server blocks do site.
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
    }"""

def patch_block(block: str) -> str:
    block = re.sub(r"sendfile\s+on\s*;", "sendfile off;", block)
    if "sendfile" not in block:
        if "root " in block:
            block = block.replace(
                f"root {live_root};",
                f"root {live_root};\n    sendfile off;",
                1,
            )
    if "location /assets/" in block:
        block = re.sub(
            r"    location /assets/ \{.*?\n    \}",
            assets,
            block,
            count=1,
            flags=re.DOTALL,
        )
    elif "    location / {" in block:
        block = block.replace("    location / {", assets + "\n    location / {", 1)
    return block

blocks = list(re.finditer(r"server\s*\{", text))
patched = 0
for m in reversed(blocks):
    start = m.start()
    depth = 0
    end = None
    for i in range(start, len(text)):
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
    if live_root not in block:
        continue
    text = text[:start] + patch_block(block) + text[end:]
    patched += 1

if patched == 0:
    print("Nenhum server block com root do site encontrado.")
    sys.exit(1)

open(path, "w").write(text)
print(f"Patch aplicado em {patched} server block(s).")
PY

if ! sudo nginx -t 2>&1; then
  echo "nginx -t falhou; restaurando backup."
  sudo cp "${CONF}.bak-deploy" "$CONF"
  exit 1
fi

sudo systemctl reload nginx
echo "Nginx recarregado."
