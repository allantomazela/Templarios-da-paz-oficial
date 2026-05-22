# Edge Function `upload-avatar` (foto de perfil do membro)

Permite que **qualquer usuário logado** envie foto em `site-assets/avatars/{seu-id}/`, usando a **service role** no servidor (não depende das políticas RLS do Storage no cliente).

## Passos no Dashboard Supabase

1. Acesse https://app.supabase.com → projeto **hxncevpbwcearzxrstzj**.
2. Menu **Edge Functions** → **Deploy a new function** → **Via Editor**.
3. Nome da função: **`upload-avatar`** (exatamente).
4. Apague o template e cole todo o conteúdo de `supabase/functions/upload-avatar/index.ts`.
5. Clique em **Deploy**.
6. Em **Secrets**, confirme que existem (geralmente automáticas): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## Testar

1. Faça deploy do site (front) com a versão que chama `upload-avatar`.
2. Login como membro comum → **Meu Perfil** → enviar foto.
3. Se falhar, abra **Edge Functions → upload-avatar → Logs** e copie o erro.

## Alternativa sem Edge Function

Execute no **SQL Editor** o arquivo `supabase/migrations/APLICAR_STORAGE_AVATAR_MEMBROS.sql`.
