#!/usr/bin/env bash
# Verificação de SSL/HTTPS em produção (executar NO SERVIDOR via SSH como root ou sudo).
# Domínio: templariosdapazoficial.com.br / www.templariosdapazoficial.com.br
set -euo pipefail

DOMAIN="templariosdapazoficial.com.br"
WWW="www.templariosdapazoficial.com.br"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
NGINX_SITE="/etc/nginx/sites-available/templarios"
FAIL=0

pass() { echo "  [OK] $1"; }
warn() { echo "  [AVISO] $1"; FAIL=1; }
fail() { echo "  [FALHA] $1"; FAIL=1; }

echo "=== Verificação SSL — Templários da Paz ==="
echo ""

echo "1. Certificado Let's Encrypt no disco"
if [ -f "${CERT_DIR}/fullchain.pem" ] && [ -f "${CERT_DIR}/privkey.pem" ]; then
  pass "Arquivos em ${CERT_DIR}"
  if command -v openssl >/dev/null 2>&1; then
    EXPIRY=$(openssl x509 -enddate -noout -in "${CERT_DIR}/fullchain.pem" | cut -d= -f2)
    echo "       Validade até: ${EXPIRY}"
    if openssl x509 -checkend 2592000 -noout -in "${CERT_DIR}/fullchain.pem" >/dev/null 2>&1; then
      pass "Certificado válido por mais de 30 dias"
    else
      warn "Certificado expira em menos de 30 dias — rode: certbot renew"
    fi
    SAN=$(openssl x509 -in "${CERT_DIR}/fullchain.pem" -noout -text 2>/dev/null | grep -A1 "Subject Alternative Name" || true)
    echo "       ${SAN:-(SAN não listado)}"
  fi
else
  fail "Certificado não encontrado em ${CERT_DIR}"
  echo "       Instale com: certbot certonly --nginx -d ${DOMAIN} -d ${WWW}"
fi
echo ""

echo "2. Certbot"
if command -v certbot >/dev/null 2>&1; then
  pass "certbot instalado"
  certbot certificates 2>/dev/null || warn "Não foi possível listar certificados (permissão?)"
else
  warn "certbot não encontrado no PATH"
fi
echo ""

echo "3. Renovação automática"
if systemctl is-enabled certbot.timer >/dev/null 2>&1; then
  pass "certbot.timer habilitado"
elif [ -f /etc/cron.d/certbot ] || grep -r certbot /etc/cron.d /etc/cron.daily 2>/dev/null | grep -q renew; then
  pass "Cron de renovação encontrado"
else
  warn "Renovação automática não detectada — configure certbot.timer ou cron"
fi
if certbot renew --dry-run >/dev/null 2>&1; then
  pass "Teste dry-run de renovação OK"
else
  warn "Dry-run de renovação falhou — verifique: certbot renew --dry-run"
fi
echo ""

echo "4. Nginx"
if [ -f "${NGINX_SITE}" ]; then
  pass "Config ${NGINX_SITE} existe"
  if grep -q "ssl_certificate.*${DOMAIN}" "${NGINX_SITE}" 2>/dev/null; then
    pass "ssl_certificate aponta para Let's Encrypt"
  else
    warn "ssl_certificate não referencia ${CERT_DIR} neste arquivo"
  fi
else
  warn "Arquivo ${NGINX_SITE} não encontrado"
fi
if nginx -t >/dev/null 2>&1; then
  pass "nginx -t OK"
else
  fail "nginx -t falhou"
  nginx -t || true
fi
if systemctl is-active nginx >/dev/null 2>&1; then
  pass "nginx ativo"
else
  fail "nginx não está ativo"
fi
echo ""

echo "5. Testes HTTP locais (loopback)"
for HOST in "${WWW}" "${DOMAIN}"; do
  CODE=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 -H "Host: ${HOST}" "https://127.0.0.1/" -k 2>/dev/null || echo "000")
  if [ "${CODE}" = "200" ]; then
    pass "HTTPS local ${HOST} → HTTP ${CODE}"
  else
    warn "HTTPS local ${HOST} → HTTP ${CODE} (esperado 200)"
  fi
done
echo ""

echo "6. Redirecionamento HTTP → HTTPS"
for HOST in "${WWW}" "${DOMAIN}"; do
  LOC=$(curl -sS -o /dev/null -w "%{redirect_url}" --max-time 10 "http://${HOST}/" 2>/dev/null || echo "")
  if echo "${LOC}" | grep -q "^https://"; then
    pass "http://${HOST} redireciona para HTTPS"
  else
    warn "http://${HOST} não redireciona corretamente (url: ${LOC:-nenhuma})"
  fi
done
echo ""

echo "7. Cadeia TLS pública (requer internet no servidor)"
if command -v openssl >/dev/null 2>&1; then
  ISSUER=$(echo | openssl s_client -connect "${WWW}:443" -servername "${WWW}" 2>/dev/null | openssl x509 -noout -issuer 2>/dev/null || echo "")
  if [ -n "${ISSUER}" ]; then
    pass "Emissor: ${ISSUER}"
  else
    warn "Não foi possível obter certificado público de ${WWW}:443"
  fi
fi
echo ""

echo "=== Resumo ==="
if [ "${FAIL}" -eq 0 ]; then
  echo "Tudo OK ou apenas avisos menores. Site deve exibir cadeado no navegador."
  exit 0
fi
echo "Há avisos ou falhas — corrija antes de considerar SSL 100% saudável."
echo ""
echo "Comandos úteis:"
echo "  certbot renew --dry-run"
echo "  certbot certificates"
echo "  certbot certonly --nginx -d ${DOMAIN} -d ${WWW}"
echo "  bash scripts/apply-stable-nginx.sh"
exit 1
