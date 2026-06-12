Exclusão de usuários e irmãos pelo painel **Admin → Gestão de Perfis** ou **Secretaria → Irmãos** (admin ou editor na secretaria).

## Status em produção

Função publicada no projeto `hxncevpbwcearzxrstzj`:

- **URL:** `https://hxncevpbwcearzxrstzj.supabase.co/functions/v1/admin-delete-user`
- **Verify JWT (gateway):** desabilitado — a função valida permissões via `requireAdmin()` / `requireAdminOrEditor()`
- **Método:** `POST` com body `{ "userId": "<uuid>" }` ou `{ "brotherId": "<uuid>" }`

### Comportamento

- **`userId` (admin):** remove cadastro(s) em `brothers` vinculados + exclui conta Auth (login encerrado na hora).
- **`brotherId` (secretaria):** remove o irmão + exclui a conta Auth vinculada, se existir.

## Republicar (CLI ou Dashboard)

1. Dashboard → **Edge Functions** → `admin-delete-user` → editar/deploy  
   **ou** Supabase CLI: `npx supabase functions deploy admin-delete-user --project-ref hxncevpbwcearzxrstzj`
2. Inclua `index.ts`, `_shared/member-deletion.ts` e os demais arquivos em `supabase/functions/_shared/` (`auth.ts`, `cors.ts`).

A função usa `SUPABASE_SERVICE_ROLE_KEY` (já injetada automaticamente no ambiente Supabase).

## Teste rápido

Com JWT de um usuário `admin`:

```http
POST /functions/v1/admin-delete-user
Authorization: Bearer <access_token>
Content-Type: application/json

{ "userId": "<uuid-do-usuario>" }
```

Com JWT de admin ou editor (secretaria):

```http
POST /functions/v1/admin-delete-user
Authorization: Bearer <access_token>
Content-Type: application/json

{ "brotherId": "<uuid-do-irmao>" }
```
