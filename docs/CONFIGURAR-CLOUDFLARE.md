# Configurar Cloudflare (corrigir site que não abre na internet)

## Por que isso é necessário?

O servidor Vultr está correto (testes no MobaXterm passam), mas muitos usuários na internet
não conseguem baixar arquivos JS/CSS grandes — a conexão é resetada no caminho até o servidor.

O **Cloudflare** fica na frente do site e entrega os arquivos pela rede dele (CDN), resolvendo o problema.

---

## Onde fazer cada etapa

| Etapa | Onde |
|-------|------|
| 1–4 | Site **cloudflare.com** (navegador do seu PC) |
| 5 | Painel do **Registro.br** (ou onde comprou o domínio) |
| 6 | **MobaXterm** (servidor Vultr) — só 1 comando no final |

---

## Passo 1 — Criar conta Cloudflare (PC, navegador)

1. Acesse https://dash.cloudflare.com/sign-up
2. Crie conta gratuita (plano **Free**)

## Passo 2 — Adicionar o site (PC, navegador)

1. **Add a site**
2. Digite: `templariosdapazoficial.com.br`
3. Plano: **Free**
4. Cloudflare vai listar os DNS atuais — confirme que existe:
   - `A` `templariosdapazoficial.com.br` → `149.28.50.209`
   - `A` ou `CNAME` `www` → `149.28.50.209` ou o apex

## Passo 3 — Ativar proxy (nuvem laranja)

Para os registros do domínio do site, clique na nuvem até ficar **laranja** (Proxied):

- `templariosdapazoficial.com.br`
- `www`

## Passo 4 — SSL no Cloudflare (PC, navegador)

1. Menu **SSL/TLS** → **Overview**
2. Modo: **Full (strict)**  
   (o servidor já tem certificado Let's Encrypt)

## Passo 5 — Trocar nameservers (Registro.br)

O Cloudflare mostrará 2 nameservers, por exemplo:

- `ada.ns.cloudflare.com`
- `bob.ns.cloudflare.com`

No **Registro.br** (ou seu registrador):

1. Domínio `templariosdapazoficial.com.br`
2. **Alterar servidores DNS**
3. Cole os 2 nameservers do Cloudflare
4. Salve

A propagação pode levar de **15 minutos a 24 horas** (geralmente menos de 1 hora).

## Passo 6 — No servidor (MobaXterm) após DNS propagar

```bash
curl -4 -sS -o /dev/null -w "via cloudflare: %{http_code} %{size_download}\n" --max-time 60 \
  "https://www.templariosdapazoficial.com.br/assets/index-BKHi60wF.js"
```

Substitua o nome do JS pelo hash atual se mudar após deploy:

```bash
grep -oE 'src="/assets/index-[^"]+\.js"' /var/www/templarios/index.html
```

Esperado: `200` e ~151000 bytes.

## Passo 7 — Testar no navegador

1. https://www.templariosdapazoficial.com.br
2. `Ctrl + Shift + R`

---

## Cache após cada deploy

No Cloudflare: **Caching** → **Configuration** → **Purge Everything**  
(ou aguarde alguns minutos — HTML já sai com `no-cache` no Nginx)

---

## Se precisar de ajuda

Envie print de:

1. DNS no Cloudflare (registros com nuvem laranja)
2. Nameservers no Registro.br
3. Resultado do `curl` do Passo 6
