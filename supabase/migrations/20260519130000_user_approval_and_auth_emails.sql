-- Diretoria e administradores podem aprovar cadastros (atualizar perfis)

CREATE OR REPLACE FUNCTION public.can_approve_users(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND email = 'allantomazela@gmail.com'
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN public.is_directorate_active(p_user_id);
END;
$$;

DROP POLICY IF EXISTS "Directorate can update profiles for approval" ON public.profiles;
CREATE POLICY "Directorate can update profiles for approval"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.can_approve_users(auth.uid()))
  WITH CHECK (public.can_approve_users(auth.uid()));
