#!/usr/bin/env bash
# Diagnóstico completo — rode NO SERVIDOR (MobaXterm) como root.
set -euo pipefail

echo "========== DIAGNÓSTICO TEMPLÁRIOS =========="
echo "Data: $(date -u)"
echo ""

echo "--- 1. Nginx sites-enabled ---"
ls -la /etc/nginx/sites-enabled/
echo ""

echo "--- 2. Conflitos server_name ---"
nginx -t 2>&1 | grep -i conflicting || echo "(nenhum conflito)"
echo ""

echo "--- 3. Bundle no index.html ---"
grep -oE 'assets/index-[^"]+\.(js|css)' /var/www/templarios/index.html || true
MAIN=$(grep -oE 'src="/assets/index-[^"]+\.js"' /var/www/templarios/index.html | head -1 | sed 's/.*\/assets\///;s/"//')
echo "MAIN=$MAIN"
echo ""

echo "--- 4. Teste LOCAL (127.0.0.1) ---"
curl -4 -k -sS -o /tmp/diag-local.js -w "LOCAL: %{http_code} %{size_download}\n" --max-time 30 \
  -H 'Host: www.templariosdapazoficial.com.br' "https://127.0.0.1/assets/$MAIN" || true
echo ""

echo "--- 5. Teste EXTERNO (pelo hostname público) ---"
curl -4 --http1.1 -sS -o /tmp/diag-ext.js -w "EXTERNO: %{http_code} %{size_download}\n" --max-time 60 \
  "https://www.templariosdapazoficial.com.br/assets/$MAIN" || true
echo ""

echo "--- 6. Firewall / MSS ---"
ufw status 2>/dev/null || echo "ufw nao instalado"
iptables -t mangle -L OUTPUT -n 2>/dev/null | grep TCPMSS || echo "sem regra MSS"
echo ""

echo "--- 7. DNS público ---"
dig +short www.templariosdapazoficial.com.br A 2>/dev/null || true
echo ""

echo "========== FIM =========="
echo "Se LOCAL=200 e navegadores não abrem: configure Cloudflare (docs/CONFIGURAR-CLOUDFLARE.md)"
