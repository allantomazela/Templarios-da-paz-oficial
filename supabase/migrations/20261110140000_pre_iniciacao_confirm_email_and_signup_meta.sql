-- Confirma e-mail também na pré-iniciação (sem enviar e-mail de "conta aprovada").
-- Cadastro via metadata pre_initiation=true já nasce em pré-iniciação (sem e-mail de pendente).
-- O trigger WHEN é ampliado; a função continua enviando account_approved só em approved.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions'
AS $$
DECLARE
  is_master_admin BOOLEAN;
  default_status public.user_status;
  default_role public.app_role;
  is_pre_initiation BOOLEAN;
BEGIN
  is_master_admin := NEW.email = 'allantomazela@gmail.com';
  is_pre_initiation := COALESCE(NEW.raw_user_meta_data->>'pre_initiation', '') = 'true';

  IF is_master_admin THEN
    default_status := 'approved';
    default_role := 'admin';
  ELSIF is_pre_initiation THEN
    default_status := 'pre_iniciacao';
    default_role := 'member';
  ELSE
    default_status := 'pending';
    default_role := 'member';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role, status, masonic_degree)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    default_role,
    default_status,
    COALESCE(NEW.raw_user_meta_data->>'masonic_degree', 'Aprendiz')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = default_role,
    status = default_status,
    masonic_degree = EXCLUDED.masonic_degree;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_email_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_exists BOOLEAN;
  should_confirm BOOLEAN;
BEGIN
  should_confirm :=
    (
      NEW.status = 'approved'::public.user_status
      AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'approved'::public.user_status)
    )
    OR (
      NEW.status = 'pre_iniciacao'::public.user_status
      AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'pre_iniciacao'::public.user_status)
    );

  IF should_confirm THEN
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = NEW.id) INTO user_exists;

    IF user_exists THEN
      UPDATE auth.users
      SET
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmed_at = COALESCE(confirmed_at, NOW())
      WHERE id = NEW.id
        AND (email_confirmed_at IS NULL OR confirmed_at IS NULL);
    END IF;
  END IF;

  -- E-mail de liberação completa só na aprovação definitiva do quadro.
  IF NEW.status = 'approved'::public.user_status
     AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'approved'::public.user_status) THEN
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

DROP TRIGGER IF EXISTS on_profile_approved_confirm_email ON public.profiles;

CREATE TRIGGER on_profile_approved_confirm_email
  AFTER UPDATE OF status ON public.profiles
  FOR EACH ROW
  WHEN (
    (
      NEW.status = 'approved'::public.user_status
      AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'approved'::public.user_status)
    )
    OR (
      NEW.status = 'pre_iniciacao'::public.user_status
      AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'pre_iniciacao'::public.user_status)
    )
  )
  EXECUTE FUNCTION public.confirm_email_on_approval();
