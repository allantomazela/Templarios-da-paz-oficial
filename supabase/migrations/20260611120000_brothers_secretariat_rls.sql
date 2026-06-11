-- Permite que cargos com acesso à secretaria (ex.: Secretário, Venerável) gerenciem irmãos,
-- alinhado ao RoleGuard do frontend (has_module_permission).

CREATE OR REPLACE FUNCTION public.can_manage_secretariat(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF public.is_admin_or_editor() THEN
    RETURN TRUE;
  END IF;

  RETURN public.has_module_permission(p_user_id, 'secretariat');
END;
$$;

COMMENT ON FUNCTION public.can_manage_secretariat IS
  'Admin/editor ou cargo com permissão ao módulo secretaria';

DROP POLICY IF EXISTS "Admins and Editors can view all brothers" ON public.brothers;
DROP POLICY IF EXISTS "Admins and Editors can insert brothers" ON public.brothers;
DROP POLICY IF EXISTS "Admins and Editors can update brothers" ON public.brothers;
DROP POLICY IF EXISTS "Admins and Editors can delete brothers" ON public.brothers;

CREATE POLICY "Secretariat can view brothers"
  ON public.brothers FOR SELECT
  TO authenticated
  USING (public.can_manage_secretariat(auth.uid()));

CREATE POLICY "Secretariat can insert brothers"
  ON public.brothers FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_secretariat(auth.uid()));

CREATE POLICY "Secretariat can update brothers"
  ON public.brothers FOR UPDATE
  TO authenticated
  USING (public.can_manage_secretariat(auth.uid()))
  WITH CHECK (public.can_manage_secretariat(auth.uid()));

CREATE POLICY "Secretariat can delete brothers"
  ON public.brothers FOR DELETE
  TO authenticated
  USING (public.can_manage_secretariat(auth.uid()));
