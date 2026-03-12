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
  - `dist/assets/index-XXXXXXXX.js`
  - `dist/assets/index-XXXXXXXX.css`
  - outros chunks em `dist/assets/`

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

## 4. Cache

- **index.html:** não cachear (ou cache curto), para o usuário sempre receber o HTML novo com os hashes do deploy atual.
- **/assets/:** pode cachear com `max-age=31536000, immutable` (os nomes têm hash).

Se após o deploy o site ainda der 404 em assets, limpar cache do navegador (ou testar em aba anônima) e, se houver, invalidar cache de CDN/proxy.

---

## 5. Domínio sem www (templariosdapazoficial.com.br) não abre

Se o site só abre em **www.templariosdapazoficial.com.br** e não em **templariosdapazoficial.com.br**:

1. **Nginx:** adicione o redirecionamento apex → www. Use o arquivo `docs/nginx-redirect-apex-to-www.conf` (copie o conteúdo para o servidor em `/etc/nginx/sites-available/` ou inclua no config do site). Depois: `sudo nginx -t && sudo systemctl reload nginx`.
2. **DNS:** o domínio apex (templariosdapazoficial.com.br) deve apontar para o mesmo IP do servidor (registro A ou ALIAS), para o Nginx receber a requisição e aplicar o redirect.
3. **SSL:** se usar HTTPS no www, configure certificado para o apex também (Let's Encrypt: `certbot -d templariosdapazoficial.com.br -d www.templariosdapazoficial.com.br`) para o redirect HTTPS→HTTPS funcionar.

---

## 6. Ícone ao instalar no celular (PWA)

O manifest usa `public/icon-192.png` e `public/icon-512.png` para o ícone exibido ao “adicionar à tela inicial”. Para exibir o logo dos Templários, substitua esses arquivos por imagens do logo em 192×192 e 512×512 pixels (PNG). O favicon do site (Configurações → Logo/Favicon) continua sendo usado nas abas; o manifest é usado apenas na instalação.
