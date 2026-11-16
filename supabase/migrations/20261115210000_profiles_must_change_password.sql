-- Senha provisória definida pelo admin: obriga troca no próximo login.
-- Troca de e-mail/senha de outro usuário continua só via Edge Function (service role).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.must_change_password IS
  'Quando true, o usuário deve definir uma nova senha imediatamente após o login.';

CREATE OR REPLACE FUNCTION public.clear_own_must_change_password()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  UPDATE public.profiles
  SET
    must_change_password = false,
    updated_at = now()
  WHERE id = auth.uid()
    AND must_change_password = true;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_own_must_change_password() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_own_must_change_password() TO authenticated;

COMMENT ON FUNCTION public.clear_own_must_change_password() IS
  'Limpa a flag must_change_password apenas do próprio usuário autenticado.';
