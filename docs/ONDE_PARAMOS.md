# Onde paramos

Arquivo de continuidade. Leia isto no início de uma sessão e atualize ao terminar uma mudança pedida.

`ESTADO_ATUAL.md` descreve uma fase antiga do projeto. Este arquivo é a referência de onde o trabalho parou.

## Última mudança concluída

| Campo | Valor |
|-------|--------|
| Data | 15/11/2026 |
| Commit | alteração local ainda não commitada |

**O que ficou pronto:** correção do logout ao confirmar senha do admin (logout Auth só com `scope=local` + reauth no cliente). Botão **Copiar mensagem** leva nome, e-mail, senha e orientação para `www.templariosdapazoficial.com.br`; após salvar, a mensagem é copiada automaticamente. Edge Function republicada.

**Arquivos:** `admin-credentials.ts`, `admin-user-api.ts`, `AdminChangePasswordDialog.tsx`, `member-access-message.ts`.

## Onde continuar

Em Admin → Usuários: **Alterar senha** para Luciano e Otacílio → gerar provisória → alterar senha → colar a mensagem no WhatsApp/privado.

## Como ver isto de novo

```bash
npm run onde-paramos
```
