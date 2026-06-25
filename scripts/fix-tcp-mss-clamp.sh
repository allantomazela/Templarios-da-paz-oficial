#!/usr/bin/env bash
# Corrige reset de conexão para clientes externos em arquivos JS/CSS maiores (MTU/MSS).
# Rode no servidor Vultr como root.
set -euo pipefail

MSS="${1:-1360}"

echo "=== Aplicando TCP MSS clamp (mss=$MSS) ==="

if ! iptables -t mangle -C OUTPUT -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss "$MSS" 2>/dev/null; then
  iptables -t mangle -A OUTPUT -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss "$MSS"
  echo "Regra OUTPUT MSS adicionada"
else
  echo "Regra OUTPUT MSS ja existe"
fi

if ! iptables -t mangle -C POSTROUTING -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu 2>/dev/null; then
  iptables -t mangle -A POSTROUTING -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu
  echo "Regra POSTROUTING clamp-mss adicionada"
else
  echo "Regra POSTROUTING clamp-mss ja existe"
fi

sysctl -w net.ipv4.tcp_mtu_probing=1
mkdir -p /etc/sysctl.d
echo 'net.ipv4.tcp_mtu_probing=1' > /etc/sysctl.d/99-templarios-tcp.conf

if command -v netfilter-persistent >/dev/null 2>&1; then
  netfilter-persistent save
elif [ -d /etc/iptables ]; then
  iptables-save > /etc/iptables/rules.v4
fi

echo "=== MSS clamp aplicado ==="
iptables -t mangle -L -n -v | head -20
