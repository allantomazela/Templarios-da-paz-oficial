#!/usr/bin/env bash
# Correção emergencial no Vultr — connection reset em JS/CSS para clientes externos.
# Rode como root no servidor.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_SRC="${SCRIPT_DIR}/../docs/nginx-templarios-vultr.conf"
TARGET="/etc/nginx/sites-available/templarios"

if [ ! -f "$CONF_SRC" ]; then
  CONF_SRC="/tmp/nginx-templarios-vultr.conf"
fi

if [ ! -f "$CONF_SRC" ]; then
  echo "ERRO: nginx-templarios-vultr.conf nao encontrado."
  exit 1
fi

echo "=== Aplicando Nginx de producao ==="
cp "$CONF_SRC" "$TARGET"
ln -sf "$TARGET" /etc/nginx/sites-enabled/templarios
rm -f /etc/nginx/sites-enabled/templariosdapazoficial.com.br

for conf in /etc/nginx/sites-enabled/* /etc/nginx/nginx.conf; do
  [ -f "$conf" ] || continue
  if grep -q 'http2' "$conf" 2>/dev/null; then
    sed -i 's/listen \(.*\) ssl http2;/listen \1 ssl;/g' "$conf"
    sed -i 's/listen \(.*\) http2;/listen \1;/g' "$conf"
    echo "http2 removido de $conf"
  fi
done

if grep -q 'sendfile[[:space:]]*on' /etc/nginx/nginx.conf 2>/dev/null; then
  sed -i 's/sendfile[[:space:]]*on;/sendfile off;/g' /etc/nginx/nginx.conf
  echo "sendfile off em nginx.conf"
fi

echo "=== MTU probing (persistente) ==="
sysctl -w net.ipv4.tcp_mtu_probing=1
mkdir -p /etc/sysctl.d
echo 'net.ipv4.tcp_mtu_probing=1' > /etc/sysctl.d/99-templarios-tcp.conf
sysctl --system >/dev/null 2>&1 || true

if [ -f "$SCRIPT_DIR/fix-tcp-mss-clamp.sh" ]; then
  bash "$SCRIPT_DIR/fix-tcp-mss-clamp.sh" 1360
fi

echo "=== Gerando .gz dos assets atuais (se existirem) ==="
if [ -d /var/www/templarios/assets ]; then
  find /var/www/templarios/assets -type f \( -name '*.js' -o -name '*.css' \) ! -name '*.gz' -print0 \
    | while IFS= read -r -d '' file; do gzip -9 -k -f "$file"; done
fi

nginx -t
systemctl restart nginx

echo ""
echo "=== Teste local (servidor) ==="
MAIN=$(grep -oE 'src="/assets/index-[^"]+\.js"' /var/www/templarios/index.html | head -1 | sed 's/.*src="\/assets\///;s/"//')
curl -4 -k -sS -o /tmp/local-main.js -w "local js: %{http_code} bytes=%{size_download}\n" --max-time 60 \
  -H 'Host: www.templariosdapazoficial.com.br' "https://127.0.0.1/assets/$MAIN"
wc -c /tmp/local-main.js

echo ""
echo "=== Teste externo (saida do proprio servidor para internet) ==="
curl -4 --http1.1 -sS -o /tmp/ext-main.js -w "externo js: %{http_code} bytes=%{size_download}\n" --max-time 60 \
  "https://www.templariosdapazoficial.com.br/assets/$MAIN" || true
wc -c /tmp/ext-main.js 2>/dev/null || true

echo ""
echo "Concluido. Teste no navegador com Ctrl+Shift+R."
