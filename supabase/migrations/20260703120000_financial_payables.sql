-- Contas a pagar: obrigações futuras sem afetar o caixa até o pagamento

CREATE TABLE IF NOT EXISTS public.financial_payables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  supplier_name TEXT,
  category_id UUID NOT NULL REFERENCES public.financial_categories(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente'
    CHECK (status IN ('Pendente', 'Pago', 'Atrasado', 'Cancelado')),
  payment_date DATE,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  forecast_item_id UUID REFERENCES public.financial_forecast_items(id) ON DELETE SET NULL,
  document_reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT check_payable_description_not_empty CHECK (LENGTH(TRIM(description)) > 0),
  CONSTRAINT check_payable_open_no_transaction CHECK (
    status = 'Pago' OR transaction_id IS NULL
  ),
  CONSTRAINT check_payable_paid_has_transaction CHECK (
    status <> 'Pago' OR transaction_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_financial_payables_due_date
  ON public.financial_payables(due_date);
CREATE INDEX IF NOT EXISTS idx_financial_payables_status
  ON public.financial_payables(status);
CREATE INDEX IF NOT EXISTS idx_financial_payables_transaction
  ON public.financial_payables(transaction_id)
  WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_financial_payables_forecast_item
  ON public.financial_payables(forecast_item_id)
  WHERE forecast_item_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_payables_open_forecast_due
  ON public.financial_payables(forecast_item_id, due_date)
  WHERE forecast_item_id IS NOT NULL
    AND status IN ('Pendente', 'Atrasado');

DROP TRIGGER IF EXISTS update_financial_payables_updated_at ON public.financial_payables;
CREATE TRIGGER update_financial_payables_updated_at
  BEFORE UPDATE ON public.financial_payables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS audit_financial_payables ON public.financial_payables;
CREATE TRIGGER audit_financial_payables
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_payables
  FOR EACH ROW
  EXECUTE FUNCTION public.create_financial_audit_log();

ALTER TABLE public.financial_payables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Financial staff can view payables" ON public.financial_payables;
CREATE POLICY "Financial staff can view payables"
  ON public.financial_payables FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
    OR public.has_module_permission(auth.uid(), 'financial')
  );

DROP POLICY IF EXISTS "Financial staff can insert payables" ON public.financial_payables;
CREATE POLICY "Financial staff can insert payables"
  ON public.financial_payables FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
    OR public.has_module_permission(auth.uid(), 'financial')
  );

DROP POLICY IF EXISTS "Financial staff can update payables" ON public.financial_payables;
CREATE POLICY "Financial staff can update payables"
  ON public.financial_payables FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
    OR public.has_module_permission(auth.uid(), 'financial')
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
    OR public.has_module_permission(auth.uid(), 'financial')
  );

DROP POLICY IF EXISTS "Financial staff can delete payables" ON public.financial_payables;
CREATE POLICY "Financial staff can delete payables"
  ON public.financial_payables FOR DELETE TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
    OR public.has_module_permission(auth.uid(), 'financial')
  );

-- Lembretes de contas a pagar (tesouraria)
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS payable_reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payable_reminder_frequency TEXT NOT NULL DEFAULT 'before'
    CHECK (payable_reminder_frequency IN ('before', 'on_due', 'after')),
  ADD COLUMN IF NOT EXISTS payable_reminder_days INTEGER NOT NULL DEFAULT 3
    CHECK (payable_reminder_days >= 0 AND payable_reminder_days <= 60);

COMMENT ON TABLE public.financial_payables IS
  'Obrigações a pagar (boletos/contas). Não afetam o caixa até status Pago com transação vinculada.';
COMMENT ON COLUMN public.site_settings.payable_reminder_enabled IS
  'Ativa lembretes automáticos de contas a pagar para a tesouraria';

CREATE TABLE IF NOT EXISTS public.payable_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payable_id UUID NOT NULL REFERENCES public.financial_payables(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  sent_date DATE NOT NULL DEFAULT (timezone('utc'::text, now()))::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payable_reminder_logs_once_per_day
  ON public.payable_reminder_logs(payable_id, sent_date);

CREATE INDEX IF NOT EXISTS idx_payable_reminder_logs_payable
  ON public.payable_reminder_logs(payable_id);

ALTER TABLE public.payable_reminder_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Financial staff can view payable reminder logs" ON public.payable_reminder_logs;
CREATE POLICY "Financial staff can view payable reminder logs"
  ON public.payable_reminder_logs FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE TABLE IF NOT EXISTS public.payable_reminder_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'cron' CHECK (source IN ('cron', 'manual')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  finished_at TIMESTAMPTZ,
  alerts_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_payable_reminder_runs_started_at
  ON public.payable_reminder_runs(started_at DESC);

ALTER TABLE public.payable_reminder_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Financial staff can view payable reminder runs" ON public.payable_reminder_runs;
CREATE POLICY "Financial staff can view payable reminder runs"
  ON public.payable_reminder_runs FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE OR REPLACE FUNCTION public.queue_payables_reminder_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url TEXT := 'https://hxncevpbwcearzxrstzj.supabase.co/functions/v1/run-payables-reminders';
  v_token TEXT;
  v_enabled BOOLEAN;
BEGIN
  SELECT payable_reminder_enabled INTO v_enabled
  FROM public.site_settings
  WHERE id = 1;

  IF NOT COALESCE(v_enabled, false) THEN
    RETURN;
  END IF;

  BEGIN
    SELECT decrypted_secret INTO v_token
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;
  EXCEPTION
    WHEN undefined_table THEN
      v_token := NULL;
    WHEN OTHERS THEN
      v_token := NULL;
  END;

  IF v_token IS NULL OR v_token = '' THEN
    RAISE WARNING 'queue_payables_reminder_job: configure vault secret service_role_key';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_token
    ),
    body := jsonb_build_object('source', 'cron')
  );
END;
$$;

COMMENT ON FUNCTION public.queue_payables_reminder_job IS
  'Dispara run-payables-reminders via pg_net (diário, 12:30 UTC).';

DO $$
DECLARE
  v_job_id BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    SELECT jobid INTO v_job_id
    FROM cron.job
    WHERE jobname = 'payables_reminder_daily'
    LIMIT 1;

    IF v_job_id IS NOT NULL THEN
      PERFORM cron.unschedule(v_job_id);
    END IF;

    PERFORM cron.schedule(
      'payables_reminder_daily',
      '30 12 * * *',
      $cron$SELECT public.queue_payables_reminder_job()$cron$
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'payables_reminder_daily cron not scheduled: %', SQLERRM;
END;
$$;
