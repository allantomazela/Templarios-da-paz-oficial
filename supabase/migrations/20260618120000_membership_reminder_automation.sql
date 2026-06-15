-- Configuração persistida e job diário (pg_cron + pg_net) para lembretes de mensalidade

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS membership_reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS membership_reminder_frequency TEXT NOT NULL DEFAULT 'after'
    CHECK (membership_reminder_frequency IN ('before', 'on_due', 'after')),
  ADD COLUMN IF NOT EXISTS membership_reminder_days INTEGER NOT NULL DEFAULT 3
    CHECK (membership_reminder_days >= 0 AND membership_reminder_days <= 28);

COMMENT ON COLUMN public.site_settings.membership_reminder_enabled IS
  'Ativa verificação diária automática de lembretes de mensalidade';
COMMENT ON COLUMN public.site_settings.membership_reminder_frequency IS
  'Momento do envio: before | on_due | after';
COMMENT ON COLUMN public.site_settings.membership_reminder_days IS
  'Dias de antecedência/atraso conforme membership_reminder_frequency';

DROP POLICY IF EXISTS "Admin write access for site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Staff can update site_settings" ON public.site_settings;
CREATE POLICY "Staff can update site_settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE OR REPLACE FUNCTION public.queue_membership_reminder_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url TEXT := 'https://hxncevpbwcearzxrstzj.supabase.co/functions/v1/run-membership-reminders';
  v_token TEXT;
  v_enabled BOOLEAN;
BEGIN
  SELECT membership_reminder_enabled INTO v_enabled
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
    RAISE WARNING 'queue_membership_reminder_job: configure vault secret service_role_key';
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

COMMENT ON FUNCTION public.queue_membership_reminder_job IS
  'Dispara run-membership-reminders via pg_net. Executado diariamente pelo pg_cron (12:00 UTC = 9h BRT).';

DO $$
DECLARE
  v_job_id BIGINT;
BEGIN
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'membership-reminder-daily'
  LIMIT 1;

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;

  PERFORM cron.schedule(
    'membership-reminder-daily',
    '0 12 * * *',
    $cron$SELECT public.queue_membership_reminder_job()$cron$
  );
END;
$$;
