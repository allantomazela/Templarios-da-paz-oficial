-- Configuração de geração automática de sessões na agenda (por loja)
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS session_weekday smallint NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS session_weeks_of_month jsonb NOT NULL DEFAULT '[1, 3, 4]'::jsonb,
  ADD COLUMN IF NOT EXISTS session_default_time text NOT NULL DEFAULT '20:00',
  ADD COLUMN IF NOT EXISTS session_default_title text NOT NULL DEFAULT 'Sessão Ordinária',
  ADD COLUMN IF NOT EXISTS session_default_location_id text NOT NULL DEFAULT '__lodge__',
  ADD COLUMN IF NOT EXISTS session_months_ahead smallint NOT NULL DEFAULT 12;

COMMENT ON COLUMN site_settings.session_weekday IS 'Dia da semana das sessões (0=domingo … 6=sábado)';
COMMENT ON COLUMN site_settings.session_weeks_of_month IS 'Ocorrências do dia no mês (ex.: [1,3,4] = 1ª, 3ª e 4ª)';
COMMENT ON COLUMN site_settings.session_default_time IS 'Horário padrão das sessões geradas (HH:mm)';
COMMENT ON COLUMN site_settings.session_default_title IS 'Título padrão das sessões geradas';
COMMENT ON COLUMN site_settings.session_default_location_id IS 'Local padrão (__lodge__, UUID ou __manual__)';
COMMENT ON COLUMN site_settings.session_months_ahead IS 'Meses à frente para geração em lote';
