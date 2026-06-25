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

# Remove http2 de qualquer listen (causa reset em clientes externos no Vultr)
# Backups ficam em sites-available — NUNCA em sites-enabled (nginx carrega tudo de la).
rm -f /etc/nginx/sites-enabled/*.bak-http2*

for conf in /etc/nginx/sites-enabled/* /etc/nginx/nginx.conf; do
  [ -f "$conf" ] || continue
  if grep -q 'http2' "$conf" 2>/dev/null; then
    if [ "$conf" = "/etc/nginx/nginx.conf" ]; then
      cp "$conf" "/etc/nginx/nginx.conf.bak-http2-$(date +%s)"
    else
      cp "$conf" "/etc/nginx/sites-available/$(basename "$conf").bak-http2-$(date +%s)"
    fi
    sed -i 's/listen \(.*\) ssl http2;/listen \1 ssl;/g' "$conf"
    sed -i 's/listen \(.*\) http2;/listen \1;/g' "$conf"
    echo "http2 removido de $conf"
  fi
done

if grep -q 'sendfile[[:space:]]*on' /etc/nginx/nginx.conf 2>/dev/null; then
  cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak-$(date +%s)
  sed -i 's/sendfile[[:space:]]*on;/sendfile off;/g' /etc/nginx/nginx.conf
fi

# MTU probing (ajuda resets em alguns links Brasil↔Vultr)
sysctl -w net.ipv4.tcp_mtu_probing=1 2>/dev/null || true
mkdir -p /etc/sysctl.d
echo 'net.ipv4.tcp_mtu_probing=1' > /etc/sysctl.d/99-templarios-tcp.conf 2>/dev/null || true

# gzip_static nos assets ja publicados
if [ -d /var/www/templarios/assets ]; then
  find /var/www/templarios/assets -type f \( -name '*.js' -o -name '*.css' \) ! -name '*.gz' -print0 \
    | while IFS= read -r -d '' file; do gzip -9 -k -f "$file" 2>/dev/null || true; done
fi

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
