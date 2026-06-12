-- E-mails automáticos de cadastro pendente e conta aprovada (via pg_net + send-user-email)

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.user_email_log (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('signup_pending', 'account_approved')),
  email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (profile_id, email_type)
);

ALTER TABLE public.user_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view user email log"
  ON public.user_email_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.queue_user_lifecycle_email(
  p_profile_id UUID,
  p_type TEXT,
  p_email TEXT,
  p_full_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url TEXT := 'https://hxncevpbwcearzxrstzj.supabase.co/functions/v1/send-user-email';
  v_token TEXT;
  v_email TEXT;
BEGIN
  v_email := lower(trim(COALESCE(p_email, '')));
  IF v_email = '' OR p_profile_id IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_email_log
    WHERE profile_id = p_profile_id
      AND email_type = p_type
  ) THEN
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
    RAISE WARNING 'queue_user_lifecycle_email: configure vault secret service_role_key para enviar %', p_type;
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_token
    ),
    body := jsonb_build_object(
      'type', p_type,
      'email', v_email,
      'full_name', COALESCE(NULLIF(trim(p_full_name), ''), 'Irmão'),
      'profile_id', p_profile_id
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.send_signup_pending_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending'::public.user_status
     AND NEW.role = 'member'::public.app_role
     AND NEW.email IS NOT NULL
     AND trim(NEW.email) <> '' THEN
    PERFORM public.queue_user_lifecycle_email(
      NEW.id,
      'signup_pending',
      NEW.email,
      NEW.full_name
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_signup_pending_email ON public.profiles;
CREATE TRIGGER on_profile_signup_pending_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_signup_pending_email();

CREATE OR REPLACE FUNCTION public.confirm_email_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  IF NEW.status = 'approved'::public.user_status
     AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'approved'::public.user_status) THEN
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = NEW.id) INTO user_exists;

    IF user_exists THEN
      UPDATE auth.users
      SET
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmed_at = COALESCE(confirmed_at, NOW())
      WHERE id = NEW.id
        AND (email_confirmed_at IS NULL OR confirmed_at IS NULL);
    END IF;

    IF NEW.email IS NOT NULL AND trim(NEW.email) <> '' THEN
      PERFORM public.queue_user_lifecycle_email(
        NEW.id,
        'account_approved',
        NEW.email,
        NEW.full_name
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in confirm_email_on_approval for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON TABLE public.user_email_log IS
  'Controle de idempotência dos e-mails transacionais de cadastro/aprovação';

COMMENT ON FUNCTION public.queue_user_lifecycle_email IS
  'Dispara send-user-email via pg_net. Requer secret vault service_role_key.';
