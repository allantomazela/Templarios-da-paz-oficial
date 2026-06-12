-- Galeria de veneráveis: visível apenas para membros aprovados da loja (não público).

CREATE OR REPLACE FUNCTION public.is_approved_lodge_member(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_user_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = p_user_id
        AND (
          p.status = 'approved'::public.user_status
          OR p.role IN ('admin'::public.app_role, 'editor'::public.app_role)
        )
    );
$$;

COMMENT ON FUNCTION public.is_approved_lodge_member IS
  'Membro aprovado da loja ou equipe admin/editor';

DROP POLICY IF EXISTS "Public read venerables" ON public.venerables;
DROP POLICY IF EXISTS "Approved lodge members can read venerables" ON public.venerables;

CREATE POLICY "Approved lodge members can read venerables"
  ON public.venerables FOR SELECT
  TO authenticated
  USING (public.is_approved_lodge_member());
