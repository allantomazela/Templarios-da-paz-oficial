-- Histórico de execuções do job de lembretes de mensalidade

CREATE TABLE IF NOT EXISTS public.membership_reminder_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('cron', 'manual')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  finished_at TIMESTAMPTZ,
  alerts_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_membership_reminder_runs_started_at
  ON public.membership_reminder_runs (started_at DESC);

ALTER TABLE public.membership_reminder_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read membership reminder runs"
  ON public.membership_reminder_runs;
CREATE POLICY "Staff read membership reminder runs"
  ON public.membership_reminder_runs FOR SELECT
  TO authenticated
  USING (public.is_admin_or_editor());

COMMENT ON TABLE public.membership_reminder_runs IS
  'Registro de cada execução automática ou manual de lembretes de mensalidade.';
