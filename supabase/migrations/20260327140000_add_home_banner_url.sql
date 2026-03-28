-- Imagem opcional em faixa larga abaixo do cabeçalho na página inicial (configurável em Site Settings).
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS home_banner_url TEXT;

COMMENT ON COLUMN public.site_settings.home_banner_url IS
  'URL da imagem de faixa abaixo do header na homepage; vazio = não exibir.';
