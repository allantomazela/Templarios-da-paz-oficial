# Checklist de deploy (evitar 404 em /assets/)

## Erro: `GET /assets/index-xxx.css net::ERR_ABORTED 404`

Significa que o navegador recebeu um `index.html` que referencia arquivos em `/assets/`, mas o servidor não encontrou esses arquivos.

---

## 1. Build local

```bash
npm run build
```

- Deve gerar a pasta `dist/` com:
  - `dist/index.html`
  - `dist/assets/index.js` (e outros chunks; nomes estáveis — ver `vite.config.ts`)
  - `dist/assets/*.css`
  - `dist/sw.js`, `dist/manifest.webmanifest`, etc.

Se `dist/assets/` estiver vazio ou não existir, o problema está no build (não no servidor).

---

## 2. Deploy: publicar a pasta inteira

O que sobe para o servidor precisa ser **toda** a pasta `dist/`, não só o `index.html`.

- **FTP/SSH:** enviar `dist/` inteiro (incluindo a pasta `assets/`).
- **CI/CD (GitHub Actions, etc.):** o step de deploy deve copiar o conteúdo de `dist/` para o `root` do site (ex.: `rsync -av dist/ deploy@servidor:/var/www/templarios/`).
- **Vercel/Netlify:** Output/Publish directory = `dist`; o build já gera `dist/` com `assets/` dentro.

No servidor, o diretório do site deve conter:

- `/index.html`
- `/assets/index-xxx.js`
- `/assets/index-xxx.css`
- etc.

---

## 3. Nginx: servir `/assets/` antes do fallback SPA

Se usar Nginx, é obrigatório ter um `location /assets/` e ele deve vir **antes** do `location /`. Ver exemplo completo em `docs/nginx-cache-headers.conf`.

Resumo:

- `root` apontando para a pasta que contém `index.html` e a pasta `assets/`.
- `location /assets/ { try_files $uri =404; }` para servir os arquivos estáticos.
- `location /` com `try_files $uri $uri/ /index.html` para SPA.

Depois: `sudo nginx -t && sudo systemctl reload nginx`.

---

## 4. Cache (importante para mobile e Chrome verem atualizações)

- **index.html:** sempre `Cache-Control: no-cache, no-store, must-revalidate`.
- **/assets/:** com **nomes estáveis** (build atual), use `Cache-Control: no-cache, must-revalidate` para que após cada deploy o mobile/Chrome peguem o JS/CSS novo. Ver `docs/nginx-cache-headers.conf`.

O Service Worker (`sw.js`) foi ajustado para usar **network-first** em JS/CSS; após o próximo deploy, usuários em mobile passarão a receber o bundle atualizado. Em cada deploy, o `sw.js` novo substitui o antigo e a versão do cache (CACHE_NAME) é incrementada quando necessário.

Se após o deploy o site ainda der 404 em assets, limpar cache do navegador (ou testar em aba anônima) e, se houver, invalidar cache de CDN/proxy.

---

## 5. Domínio sem www (templariosdapazoficial.com.br) não abre

Se o site só abre em **www.templariosdapazoficial.com.br** e não em **templariosdapazoficial.com.br**:

1. **Nginx:** adicione o redirecionamento apex → www. Use o arquivo `docs/nginx-redirect-apex-to-www.conf` (copie o conteúdo para o servidor em `/etc/nginx/sites-available/` ou inclua no config do site). Depois: `sudo nginx -t && sudo systemctl reload nginx`.
2. **DNS:** o domínio apex (templariosdapazoficial.com.br) deve apontar para o mesmo IP do servidor (registro A ou ALIAS), para o Nginx receber a requisição e aplicar o redirect.
3. **SSL:** se usar HTTPS no www, configure certificado para o apex também (Let's Encrypt: `certbot -d templariosdapazoficial.com.br -d www.templariosdapazoficial.com.br`) para o redirect HTTPS→HTTPS funcionar.

---

## 6. Próximo passo no servidor (Vultr/Nginx)

Para que **mobile e Chrome** sempre vejam a versão nova após cada deploy:

1. **Aplicar headers de cache** no Nginx conforme `docs/nginx-cache-headers.conf` (em especial `location = /index.html` e `location /assets/` com `no-cache, must-revalidate`).
2. Fazer **deploy** deste repositório (incluindo o `sw.js` atualizado com network-first para JS/CSS).
3. Usuários que já têm o site aberto podem precisar **recarregar uma vez** (ou fechar e reabrir a aba) para o novo Service Worker ativar; depois disso as atualizações passam a ser vistas normalmente.

---

## 7. Ícone ao instalar no celular (PWA)

O manifest usa apenas `favicon.png` (48×48) para evitar erro “Resource size is not correct”. O favicon do site (Configurações → Logo/Favicon) é usado nas abas e no ícone de instalação. Se quiser ícones maiores na instalação, crie PNGs exatamente 192×192 e 512×512, coloque em `public/icon-192.png` e `public/icon-512.png`, e adicione as entradas correspondentes em `public/manifest.webmanifest` (com `sizes` e `src` corretos).
