-- Estende permissões de secretaria (cargos + admin/editor) às demais tabelas do módulo.
-- Depende de public.can_manage_secretariat (20260611120000_brothers_secretariat_rls.sql).

-- Candidatos à iniciação
DROP POLICY IF EXISTS "Admin and Editor can view initiation candidates" ON public.initiation_candidates;
DROP POLICY IF EXISTS "Admin and Editor can insert initiation candidates" ON public.initiation_candidates;
DROP POLICY IF EXISTS "Admin and Editor can update initiation candidates" ON public.initiation_candidates;
DROP POLICY IF EXISTS "Admin and Editor can delete initiation candidates" ON public.initiation_candidates;

CREATE POLICY "Secretariat can view initiation candidates"
  ON public.initiation_candidates FOR SELECT TO authenticated
  USING (public.can_manage_secretariat(auth.uid()));

CREATE POLICY "Secretariat can insert initiation candidates"
  ON public.initiation_candidates FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_secretariat(auth.uid()));

CREATE POLICY "Secretariat can update initiation candidates"
  ON public.initiation_candidates FOR UPDATE TO authenticated
  USING (public.can_manage_secretariat(auth.uid()))
  WITH CHECK (public.can_manage_secretariat(auth.uid()));

CREATE POLICY "Secretariat can delete initiation candidates"
  ON public.initiation_candidates FOR DELETE TO authenticated
  USING (public.can_manage_secretariat(auth.uid()));

-- Andamento das fases
DROP POLICY IF EXISTS "Admin and Editor can view candidate phase progress" ON public.candidate_phase_progress;
DROP POLICY IF EXISTS "Admin and Editor can insert candidate phase progress" ON public.candidate_phase_progress;
DROP POLICY IF EXISTS "Admin and Editor can update candidate phase progress" ON public.candidate_phase_progress;
DROP POLICY IF EXISTS "Admin and Editor can delete candidate phase progress" ON public.candidate_phase_progress;

CREATE POLICY "Secretariat can view candidate phase progress"
  ON public.candidate_phase_progress FOR SELECT TO authenticated
  USING (public.can_manage_secretariat(auth.uid()));

CREATE POLICY "Secretariat can insert candidate phase progress"
  ON public.candidate_phase_progress FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_secretariat(auth.uid()));

CREATE POLICY "Secretariat can update candidate phase progress"
  ON public.candidate_phase_progress FOR UPDATE TO authenticated
  USING (public.can_manage_secretariat(auth.uid()))
  WITH CHECK (public.can_manage_secretariat(auth.uid()));

CREATE POLICY "Secretariat can delete candidate phase progress"
  ON public.candidate_phase_progress FOR DELETE TO authenticated
  USING (public.can_manage_secretariat(auth.uid()));

-- Definições de fases da sindicância
DROP POLICY IF EXISTS "Admin and Editor can manage phase definitions" ON public.sindicancia_phase_definitions;

CREATE POLICY "Secretariat can manage phase definitions"
  ON public.sindicancia_phase_definitions FOR ALL TO authenticated
  USING (public.can_manage_secretariat(auth.uid()))
  WITH CHECK (public.can_manage_secretariat(auth.uid()));

-- Documentos da loja (mutações; leitura continua para todos autenticados)
DROP POLICY IF EXISTS "Admins and Editors can insert documents" ON public.lodge_documents;
DROP POLICY IF EXISTS "Admins and Editors can update documents" ON public.lodge_documents;
DROP POLICY IF EXISTS "Admins and Editors can delete documents" ON public.lodge_documents;

CREATE POLICY "Secretariat can insert documents"
  ON public.lodge_documents FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_secretariat(auth.uid()));

CREATE POLICY "Secretariat can update documents"
  ON public.lodge_documents FOR UPDATE TO authenticated
  USING (public.can_manage_secretariat(auth.uid()))
  WITH CHECK (public.can_manage_secretariat(auth.uid()));

CREATE POLICY "Secretariat can delete documents"
  ON public.lodge_documents FOR DELETE TO authenticated
  USING (public.can_manage_secretariat(auth.uid()));
