#!/usr/bin/env bash
# Aplica config Nginx corrigida no Vultr. Rode no servidor como root.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_SRC="${1:-}"
[ -z "$CONF_SRC" ] && CONF_SRC="${SCRIPT_DIR}/../docs/nginx-templarios-vultr.conf"
[ ! -f "$CONF_SRC" ] && CONF_SRC="/tmp/nginx-templarios-vultr.conf"
TARGET="/etc/nginx/sites-available/templarios"
ENABLED="/etc/nginx/sites-enabled/templarios"

if [ ! -f "$CONF_SRC" ]; then
  echo "ERRO: nginx-templarios-vultr.conf nao encontrado."
  exit 1
fi

if [ ! -f /etc/letsencrypt/live/templariosdapazoficial.com.br/fullchain.pem ]; then
  echo "ERRO: certificado SSL nao encontrado no caminho esperado."
  exit 1
fi

[ -f "$TARGET" ] && cp "$TARGET" "${TARGET}.bak-$(date +%s)"

cp "$CONF_SRC" "$TARGET"
ln -sf "$TARGET" "$ENABLED"

# Desliga sendfile global
if grep -q 'sendfile[[:space:]]*on' /etc/nginx/nginx.conf 2>/dev/null; then
  cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak-$(date +%s)
  sed -i 's/sendfile[[:space:]]*on;/sendfile off;/g' /etc/nginx/nginx.conf
fi

# MTU probing (ajuda resets em alguns links Brasil↔Vultr)
sysctl -w net.ipv4.tcp_mtu_probing=1 2>/dev/null || true

nginx -t
systemctl restart nginx

echo ""
echo "Testando..."
curl -4 -k -sS -o /tmp/apply-test.html -w "HTTPS local html: %{http_code} bytes=%{size_download}\n" --max-time 30 \
  -H 'Host: www.templariosdapazoficial.com.br' https://127.0.0.1/
wc -c /tmp/apply-test.html

JS=$(grep -oE 'src="/assets/index-[^"]+\.js"' /tmp/apply-test.html | head -1 | sed 's/.*src="//;s/"//')
if [ -n "$JS" ]; then
  curl -4 -k -sS -o /tmp/apply-test.js -w "HTTPS local js: %{http_code} bytes=%{size_download}\n" --max-time 60 \
    -H 'Host: www.templariosdapazoficial.com.br' "https://127.0.0.1/assets/$JS"
fi

echo "Concluido. Teste no navegador com Ctrl+Shift+R."
