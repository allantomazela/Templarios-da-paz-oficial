-- Indicações de candidatos à iniciação e acompanhamento por fases da sindicância.
-- Acesso: apenas admin ou editor (Secretaria).

-- Definição das fases da sindicância (template da loja)
CREATE TABLE IF NOT EXISTS public.sindicancia_phase_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sindicancia_phase_definitions_order
  ON public.sindicancia_phase_definitions("order");

-- Candidatos indicados à iniciação
CREATE TABLE IF NOT EXISTS public.initiation_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  indicated_by TEXT NOT NULL,
  indication_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'em_sindicancia'
    CHECK (status IN ('indicado', 'em_sindicancia', 'aprovado', 'reprovado', 'iniciado')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_initiation_candidates_status ON public.initiation_candidates(status);
CREATE INDEX IF NOT EXISTS idx_initiation_candidates_indication_date ON public.initiation_candidates(indication_date DESC);

-- Andamento de cada candidato por fase (uma linha por candidato + fase)
CREATE TABLE IF NOT EXISTS public.candidate_phase_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.initiation_candidates(id) ON DELETE CASCADE,
  phase_definition_id UUID NOT NULL REFERENCES public.sindicancia_phase_definitions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(candidate_id, phase_definition_id)
);

CREATE INDEX IF NOT EXISTS idx_candidate_phase_progress_candidate
  ON public.candidate_phase_progress(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_phase_progress_phase
  ON public.candidate_phase_progress(phase_definition_id);

-- RLS
ALTER TABLE public.sindicancia_phase_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiation_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_phase_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin and Editor can manage phase definitions" ON public.sindicancia_phase_definitions;
CREATE POLICY "Admin and Editor can manage phase definitions"
  ON public.sindicancia_phase_definitions FOR ALL TO authenticated
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS "Admin and Editor can view initiation candidates" ON public.initiation_candidates;
DROP POLICY IF EXISTS "Admin and Editor can insert initiation candidates" ON public.initiation_candidates;
DROP POLICY IF EXISTS "Admin and Editor can update initiation candidates" ON public.initiation_candidates;
DROP POLICY IF EXISTS "Admin and Editor can delete initiation candidates" ON public.initiation_candidates;

CREATE POLICY "Admin and Editor can view initiation candidates"
  ON public.initiation_candidates FOR SELECT TO authenticated
  USING (public.is_admin_or_editor());
CREATE POLICY "Admin and Editor can insert initiation candidates"
  ON public.initiation_candidates FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_editor());
CREATE POLICY "Admin and Editor can update initiation candidates"
  ON public.initiation_candidates FOR UPDATE TO authenticated
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());
CREATE POLICY "Admin and Editor can delete initiation candidates"
  ON public.initiation_candidates FOR DELETE TO authenticated
  USING (public.is_admin_or_editor());

DROP POLICY IF EXISTS "Admin and Editor can view candidate phase progress" ON public.candidate_phase_progress;
DROP POLICY IF EXISTS "Admin and Editor can insert candidate phase progress" ON public.candidate_phase_progress;
DROP POLICY IF EXISTS "Admin and Editor can update candidate phase progress" ON public.candidate_phase_progress;
DROP POLICY IF EXISTS "Admin and Editor can delete candidate phase progress" ON public.candidate_phase_progress;

CREATE POLICY "Admin and Editor can view candidate phase progress"
  ON public.candidate_phase_progress FOR SELECT TO authenticated
  USING (public.is_admin_or_editor());
CREATE POLICY "Admin and Editor can insert candidate phase progress"
  ON public.candidate_phase_progress FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_editor());
CREATE POLICY "Admin and Editor can update candidate phase progress"
  ON public.candidate_phase_progress FOR UPDATE TO authenticated
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());
CREATE POLICY "Admin and Editor can delete candidate phase progress"
  ON public.candidate_phase_progress FOR DELETE TO authenticated
  USING (public.is_admin_or_editor());

-- Trigger updated_at para initiation_candidates
CREATE OR REPLACE FUNCTION public.update_initiation_candidates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_initiation_candidates_updated_at ON public.initiation_candidates;
CREATE TRIGGER update_initiation_candidates_updated_at
  BEFORE UPDATE ON public.initiation_candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_initiation_candidates_updated_at();

-- Trigger updated_at para candidate_phase_progress
CREATE OR REPLACE FUNCTION public.update_candidate_phase_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_candidate_phase_progress_updated_at ON public.candidate_phase_progress;
CREATE TRIGGER update_candidate_phase_progress_updated_at
  BEFORE UPDATE ON public.candidate_phase_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_candidate_phase_progress_updated_at();

-- Fases padrão da sindicância (seed apenas se a tabela estiver vazia)
INSERT INTO public.sindicancia_phase_definitions (name, "order", description)
SELECT v.name, v.ord, v.description
FROM (VALUES
  ('Documentação'::TEXT, 1, 'Análise e conferência dos documentos apresentados'::TEXT),
  ('Entrevistas', 2, 'Entrevistas com o candidato'),
  ('Visita à Loja', 3, 'Visita do candidato à loja'),
  ('Parecer da Comissão', 4, 'Parecer da comissão de sindicância'),
  ('Votação', 5, 'Votação em loja')
) AS v(name, ord, description)
WHERE NOT EXISTS (SELECT 1 FROM public.sindicancia_phase_definitions LIMIT 1);
