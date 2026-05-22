# Edge Function: admin-delete-user

Exclusão de usuários pelo painel **Admin → Gestão de Perfis** (somente papel `admin`).

## Publicar no Supabase

1. Dashboard → **Edge Functions** → **Create function**
2. Nome: `admin-delete-user`
3. Cole o conteúdo de `index.ts` (e garanta que `_shared/auth.ts` e `_shared/cors.ts` existem no projeto)
4. Deploy
5. Em **Settings** da função, habilite **Verify JWT** (recomendado)

A função usa `SUPABASE_SERVICE_ROLE_KEY` (já injetada automaticamente no ambiente Supabase).

## Teste rápido

Com JWT de um usuário `admin`:

```http
POST /functions/v1/admin-delete-user
Authorization: Bearer <access_token>
Content-Type: application/json

{ "userId": "<uuid-do-usuario>" }
```
