# Edge Function: admin-delete-user

Exclusão de usuários pelo painel **Admin → Gestão de Perfis** (somente papel `admin`).

## Status em produção

Função publicada no projeto `hxncevpbwcearzxrstzj`:

- **URL:** `https://hxncevpbwcearzxrstzj.supabase.co/functions/v1/admin-delete-user`
- **Verify JWT (gateway):** desabilitado — a função valida admin via `requireAdmin()` (evita 401 com JWT assimétrico)
- **Método:** `POST` com body `{ "userId": "<uuid>" }`

## Republicar (CLI ou Dashboard)

1. Dashboard → **Edge Functions** → `admin-delete-user` → editar/deploy  
   **ou** Supabase CLI: `npx supabase functions deploy admin-delete-user --project-ref hxncevpbwcearzxrstzj`
2. Inclua `index.ts` e os arquivos em `supabase/functions/_shared/` (`auth.ts`, `cors.ts`).

A função usa `SUPABASE_SERVICE_ROLE_KEY` (já injetada automaticamente no ambiente Supabase).

## Teste rápido

Com JWT de um usuário `admin`:

```http
POST /functions/v1/admin-delete-user
Authorization: Bearer <access_token>
Content-Type: application/json

{ "userId": "<uuid-do-usuario>" }
```
