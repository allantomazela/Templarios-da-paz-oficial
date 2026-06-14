-- Notificar a partir do 1º dia após o vencimento (dia 10), sem espera extra por padrão
ALTER TABLE public.site_settings
  ALTER COLUMN membership_reminder_days SET DEFAULT 0;

COMMENT ON COLUMN public.site_settings.membership_reminder_days IS
  'Dias de antecedência/atraso conforme membership_reminder_frequency (0 = imediato após vencimento)';
