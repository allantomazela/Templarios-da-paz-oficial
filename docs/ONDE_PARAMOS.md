# Onde paramos

Arquivo de continuidade. Leia isto no início de uma sessão e atualize ao terminar uma mudança pedida.

`ESTADO_ATUAL.md` descreve uma fase antiga do projeto. Este arquivo é a referência de onde o trabalho parou.

## Última mudança concluída

| Campo | Valor |
|-------|--------|
| Data | 15/11/2026 |
| Commit | (em push) |

**O que ficou pronto:** Admin pode **Alterar senha** e **Alterar e-mail** (com senha do admin). Senha provisória exige troca em `/force-change-password`. Migration e Edge Function `admin-manage-credentials` já estão no Supabase Templários Oficial. Mantida a gestão de pré-iniciação já existente no remoto.

**Arquivos principais:** `UserManagement.tsx`, dialogs de senha/e-mail, `ForceChangePassword.tsx`, `admin-manage-credentials`, migration `20261115210000_profiles_must_change_password.sql`.

## Banco / deploy

- Migration e função ativas em `hxncevpbwcearzxrstzj`.

## Onde continuar

Em Admin → Usuários: **Alterar senha** para Luciano e Otacílio (gerar provisória + exigir troca). Se o e-mail estiver morto, use **Alterar e-mail** antes. Admitir no quadro com a data da iniciação quando for o caso.

## Como ver isto de novo

```bash
npm run onde-paramos
```
