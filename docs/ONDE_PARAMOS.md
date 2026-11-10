# Onde paramos

Arquivo de continuidade. Leia isto no início de uma sessão e atualize ao terminar uma mudança pedida.

`ESTADO_ATUAL.md` descreve uma fase antiga do projeto. Este arquivo é a referência de onde o trabalho parou.

## Última mudança concluída

| Campo | Valor |
|-------|--------|
| Data | 10/11/2026 |
| Commit | 4afe0ab |

**O que ficou pronto:** cadastro admin de iniciando em pré-iniciação, sem passar pelo fluxo pendente/aprovado. Em **Admin → Gestão de Perfis**, o botão **Criar iniciando** gera conta com e-mail já confirmado, status `pre_iniciacao`, senha temporária só na tela do admin, e registro na secretaria fora do quadro (sem mensalidade). Migração `pre_iniciacao_confirm_email_and_signup_meta` aplicada no **Templários Oficial**: `handle_new_user` respeita metadata `pre_initiation`; confirmação de e-mail também em `pre_iniciacao`; e-mail `account_approved` continua só em `approved`. Edge Function `admin-create-pre-initiation-user` publicada (`verify_jwt` off, auth via `requireAdmin`). Arquivos: `CreatePreInitiationDialog.tsx`, `admin-user-api.ts`, `UserManagement.tsx`, `supabase/functions/admin-create-pre-initiation-user/`.

## Banco

Em 10/11/2026 a migração `pre_iniciacao_confirm_email_and_signup_meta` foi aplicada no Supabase **Templários Oficial**.

Em 06/11/2026 as migrações `user_status_pre_iniciacao` e `pre_iniciacao_situation_and_privilege` foram aplicadas no Supabase **Templários Oficial**.

## Onde continuar

Cadastrar Otacilio e Luciano via **Criar iniciando** → no dia 14/11 marcar Incluir iniciandos na chamada → depois **Admitir no quadro**.

## Como ver isto de novo

```bash
npm run onde-paramos
```
