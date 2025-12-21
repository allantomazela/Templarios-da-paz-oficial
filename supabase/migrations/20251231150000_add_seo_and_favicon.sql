ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS site_title TEXT DEFAULT 'Templários da Paz';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT 'Loja Maçônica Templários da Paz - Botucatu/SP';
