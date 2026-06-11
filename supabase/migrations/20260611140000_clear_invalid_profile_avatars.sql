-- Remove placeholders automáticos (ex.: usecurling) do avatar de perfil.
-- Usuários sem foto verão iniciais até enviarem a própria imagem.

UPDATE public.profiles
SET avatar_url = NULL,
    updated_at = timezone('utc'::text, now())
WHERE avatar_url IS NOT NULL
  AND avatar_url ILIKE '%usecurling.com%';
