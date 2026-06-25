#!/usr/bin/env bash
# Diagnóstico no servidor Vultr — rode como root: bash diagnose-server.sh
set -uo pipefail

echo "========== DISCO E ARQUIVOS =========="
df -h / /var/www 2>/dev/null || df -h /
ls -la /var/www/templarios/index.html 2>/dev/null || echo "ERRO: index.html ausente"
ls /var/www/templarios/assets/*.js 2>/dev/null | wc -l | xargs echo "Arquivos JS em assets:"

echo ""
echo "========== NGINX CONFIG =========="
nginx -t 2>&1
grep -rn 'sendfile\|http2\|templarios' /etc/nginx/nginx.conf /etc/nginx/sites-enabled/ 2>/dev/null | head -40

echo ""
echo "========== TESTE HTTPS LOCAL =========="
for path in "/" "/assets/"; do
  code=$(curl -4 -k -sS -o /tmp/diag-body -w '%{http_code}' --max-time 30 \
    -H 'Host: www.templariosdapazoficial.com.br' "https://127.0.0.1${path}" 2>/dev/null || echo "000")
  size=$(wc -c < /tmp/diag-body 2>/dev/null || echo 0)
  echo "HTTPS 127.0.0.1${path} -> HTTP $code size=$size"
done

MAIN_JS=$(grep -oE 'src="/assets/index-[^"]+\.js"' /tmp/diag-body 2>/dev/null | head -1 | sed 's/.*src="//;s/"//' || true)
if [ -n "$MAIN_JS" ]; then
  code=$(curl -4 -k -sS -o /tmp/diag-js -w '%{http_code}' --max-time 60 \
    -H 'Host: www.templariosdapazoficial.com.br' "https://127.0.0.1/assets/$MAIN_JS" 2>/dev/null || echo "000")
  size=$(wc -c < /tmp/diag-js 2>/dev/null || echo 0)
  echo "HTTPS JS /assets/$MAIN_JS -> HTTP $code size=$size"
fi

echo ""
echo "========== TESTE HTTPS EXTERNO (do servidor) =========="
curl -4 -sS -o /tmp/diag-ext.html -w "externo html: %{http_code} %{size_download}\n" --max-time 60 \
  "https://www.templariosdapazoficial.com.br/" 2>&1 || true

echo ""
echo "========== ULTIMOS ERROS NGINX =========="
tail -20 /var/log/nginx/templarios_error.log 2>/dev/null || tail -20 /var/log/nginx/error.log 2>/dev/null

echo ""
echo "========== NGINX STATUS =========="
systemctl is-active nginx
