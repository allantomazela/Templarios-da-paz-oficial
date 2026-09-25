-- Otimiza RLS de leitura: avalia is_admin_or_editor() no máximo 1x por query
-- (InitPlan), em vez de potencialmente a cada linha.

DROP POLICY IF EXISTS "Authenticated can view essential links" ON public.essential_links;
DROP POLICY IF EXISTS "Authenticated can view active essential links" ON public.essential_links;
DROP POLICY IF EXISTS "Admin and Editor can view all essential links" ON public.essential_links;

CREATE POLICY "Authenticated can view essential links"
  ON public.essential_links FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR (SELECT public.is_admin_or_editor())
  );
