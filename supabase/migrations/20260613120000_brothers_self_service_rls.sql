-- Permite que cada irmão visualize e atualize o próprio cadastro em brothers (perfil > Cadastro Completo).

CREATE OR REPLACE FUNCTION public.is_own_brother_row(b public.brothers)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.profile_id = auth.uid()
    OR (
      auth.uid() IS NOT NULL
      AND lower(trim(b.email)) = lower(trim(COALESCE(
        (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()),
        ''
      )))
      AND trim(COALESCE(
        (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()),
        ''
      )) <> ''
    );
$$;

COMMENT ON FUNCTION public.is_own_brother_row IS
  'Verifica se o registro em brothers pertence ao usuário autenticado';

DROP POLICY IF EXISTS "Members can view own brother record" ON public.brothers;
DROP POLICY IF EXISTS "Members can insert own brother record" ON public.brothers;
DROP POLICY IF EXISTS "Members can update own brother record" ON public.brothers;

CREATE POLICY "Members can view own brother record"
  ON public.brothers FOR SELECT
  TO authenticated
  USING (public.is_own_brother_row(brothers));

CREATE POLICY "Members can insert own brother record"
  ON public.brothers FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    AND lower(trim(email)) = lower(trim(COALESCE(
      (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()),
      ''
    )))
  );

CREATE POLICY "Members can update own brother record"
  ON public.brothers FOR UPDATE
  TO authenticated
  USING (public.is_own_brother_row(brothers))
  WITH CHECK (
    profile_id = auth.uid()
    AND lower(trim(email)) = lower(trim(COALESCE(
      (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()),
      ''
    )))
  );
