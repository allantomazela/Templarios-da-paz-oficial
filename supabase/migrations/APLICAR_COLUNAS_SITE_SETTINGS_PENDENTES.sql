-- Execute no SQL Editor do Supabase (produção) se colunas novas ainda não existirem.
-- O frontend usa select('*'); sem estas colunas, leitura funciona, mas recursos novos ficam vazios.

ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS home_banner_url TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_card_bg_url TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS checkin_temple_url TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contact_message_email TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS temple_latitude DOUBLE PRECISION;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS temple_longitude DOUBLE PRECISION;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS checkin_radius_meters INTEGER;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS checkin_open_minutes_before INTEGER;
