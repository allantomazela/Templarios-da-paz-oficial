#!/usr/bin/env bash
# Diagnóstico rápido no Vultr — rode como root.
set -euo pipefail

LIVE="/var/www/templarios"
LEGACY="/var/www/templarios-assets-legacy"

echo "=== index.html no servidor (hashes atuais) ==="
grep -oE 'assets/index-[^"]+\.(js|css)' "$LIVE/index.html" || true

echo ""
echo "=== Arquivos index-*.js em assets/ ==="
ls -1 "$LIVE/assets"/index-*.js 2>/dev/null | head -5 || echo "(nenhum)"

echo ""
echo "=== Busca por hashes antigos reportados no browser ==="
for f in index-iBTmNdUq.js index-zahyOeOu.css index-BKHi60wF.js; do
  if [ -f "$LIVE/assets/$f" ]; then
    echo "OK  $f"
  elif [ -f "$LEGACY/$f" ] 2>/dev/null; then
    echo "LEGACY $f"
  else
    echo "404 $f (não existe no servidor)"
  fi
done

echo ""
echo "=== HTML servido pela internet (sem cache) ==="
curl -4 -sS -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' \
  "https://www.templariosdapazoficial.com.br/?_=$(date +%s)" \
  | grep -oE 'assets/index-[^"]+\.(js|css)' || true

echo ""
echo "=== Teste do bundle principal atual ==="
MAIN=$(grep -oE 'src="/assets/index-[^"]+\.js"' "$LIVE/index.html" | head -1 | sed 's/.*\/assets\///;s/"//')
if [ -n "$MAIN" ]; then
  curl -4 -sS -I --max-time 20 "https://www.templariosdapazoficial.com.br/assets/$MAIN" | head -5
fi
