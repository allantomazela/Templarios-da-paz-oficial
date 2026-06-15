-- Permite registrar lembretes de mensalidade por cronograma (sem lançamento específico)
ALTER TABLE public.reminder_logs
  ALTER COLUMN contribution_id DROP NOT NULL;

COMMENT ON COLUMN public.reminder_logs.contribution_id IS
  'Opcional: preenchido para lembretes ligados a um lançamento; NULL para lembretes por cronograma.';
