-- Configuração do templo para check-in por QR code
-- Latitude e longitude do ponto do templo, raio permitido (metros) e minutos antes do início da sessão

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS temple_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS temple_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS checkin_radius_meters INTEGER,
  ADD COLUMN IF NOT EXISTS checkin_open_minutes_before INTEGER;

COMMENT ON COLUMN public.site_settings.temple_latitude IS 'Latitude do ponto do templo para validação de check-in por geolocalização';
COMMENT ON COLUMN public.site_settings.temple_longitude IS 'Longitude do ponto do templo para validação de check-in por geolocalização';
COMMENT ON COLUMN public.site_settings.checkin_radius_meters IS 'Raio em metros dentro do qual o check-in por QR é permitido';
COMMENT ON COLUMN public.site_settings.checkin_open_minutes_before IS 'Minutos antes do horário de início da sessão em que o check-in é liberado';
