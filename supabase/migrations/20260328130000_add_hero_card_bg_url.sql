-- Fundo opcional do card principal do hero na homepage (templo / arquitetura gótica).
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_card_bg_url TEXT;

COMMENT ON COLUMN public.site_settings.hero_card_bg_url IS
  'URL da imagem de fundo do card do hero; vazio = usar imagem padrão no frontend.';
