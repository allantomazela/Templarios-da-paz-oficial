#!/usr/bin/env bash
# Gera .gz para nginx gzip_static servir bundles menores (menos reset em redes externas).
set -euo pipefail

DIST="${1:-dist}"

if [ ! -d "$DIST/assets" ]; then
  echo "ERRO: $DIST/assets nao encontrado"
  exit 1
fi

find "$DIST/assets" -type f \( -name '*.js' -o -name '*.css' \) -print0 \
  | while IFS= read -r -d '' file; do
      gzip -9 -k -f "$file"
    done

echo "gzip_static: arquivos .gz gerados em $DIST/assets"
