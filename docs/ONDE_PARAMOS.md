# Onde paramos

Arquivo de continuidade. Leia isto no início de uma sessão e atualize ao terminar uma mudança pedida.

`ESTADO_ATUAL.md` descreve uma fase antiga do projeto. Este arquivo é a referência de onde o trabalho parou.

## Última mudança concluída

| Campo | Valor |
|-------|--------|
| Data | 22/11/2026 |
| Commit | a7d0828 |

**O que ficou pronto:** favicon/aba alinhados ao brasão oficial; PWA força update (SW carimbado + reload); Nginx estável com no-cache para favicon/manifest/ícones (aplicado no deploy via `apply-stable-nginx.sh`).

**Arquivos:** `SeoManager.tsx`, `register-service-worker.ts`, `default-brand-assets.ts`, `LogoSettings.tsx`, `vite.config.ts`, `public/sw.js`, `public/.htaccess`, `public/favicon.ico`, `docs/nginx-templarios-stable.conf`.

## Onde continuar

Após o Actions concluir o deploy: validar ícone da aba (hard refresh) e headers `Cache-Control` em `/favicon.png` e `/sw.js`. Confirmar que o app instalado recarrega após o publish.

## Como ver isto de novo

```bash
npm run onde-paramos
```
