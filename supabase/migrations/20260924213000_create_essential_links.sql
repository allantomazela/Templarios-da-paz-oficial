-- Links Essenciais: recursos externos do GOB-SP/Federação.
-- Leitura: autenticados (membros veem apenas ativos; admin/editor veem todos).
-- Escrita: admin ou editor.

CREATE TABLE IF NOT EXISTS public.essential_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Link2',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT essential_links_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT essential_links_url_not_empty CHECK (LENGTH(TRIM(url)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_essential_links_active_sort
  ON public.essential_links (is_active, sort_order);

ALTER TABLE public.essential_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view essential links" ON public.essential_links;
DROP POLICY IF EXISTS "Admin and Editor can insert essential links" ON public.essential_links;
DROP POLICY IF EXISTS "Admin and Editor can update essential links" ON public.essential_links;
DROP POLICY IF EXISTS "Admin and Editor can delete essential links" ON public.essential_links;

CREATE POLICY "Authenticated can view essential links"
  ON public.essential_links FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR public.is_admin_or_editor()
  );

CREATE POLICY "Admin and Editor can insert essential links"
  ON public.essential_links FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_editor());

CREATE POLICY "Admin and Editor can update essential links"
  ON public.essential_links FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

CREATE POLICY "Admin and Editor can delete essential links"
  ON public.essential_links FOR DELETE
  TO authenticated
  USING (public.is_admin_or_editor());

-- Seed inicial (idempotente)
INSERT INTO public.essential_links (title, url, icon_name, sort_order, is_active)
SELECT v.title, v.url, v.icon_name, v.sort_order, true
FROM (
  VALUES
    ('Grande Oriente de São Paulo', 'https://gobsp.org.br/', 'Landmark', 10),
    ('Caixa Postal do GOB', 'https://caixapostal.gob.org.br/', 'Mail', 20),
    ('Canal do Youtube', 'https://www.youtube.com/@gobsp', 'Youtube', 30),
    ('e-GOB Card', 'https://www.gob.org.br/e-gob-card/', 'CreditCard', 40),
    ('Facebook GOB-SP', 'https://www.facebook.com/gobsaopaulo/', 'Facebook', 50),
    ('Frafem GOB-SP', 'https://frafem.gobsp.org.br/', 'HeartHandshake', 60),
    ('Instagram GOB-SP', 'https://www.instagram.com/gobsaopaulo/', 'Instagram', 70),
    ('METAGOB', 'https://meta.gob.org.br/sign-in?redirect=%2Fdashboard', 'Monitor', 80),
    ('NEW GOB NET', 'https://newgobnet.gob.org.br/newcore/login?est=wvbajF4bZwFjWgOZpaO89w==', 'Network', 90),
    ('RGF - Regulamento Geral da Federação', 'https://goblex.gob.org.br/?password-protected=login&redirect_to=https%3A%2F%2Fgoblex.gob.org.br%2Flegislacao%2Fregulamento-geral-da-federacao%2F', 'Scale', 100),
    ('SITE DO GOB', 'https://www.gob.org.br/', 'Globe', 110),
    ('SOL - Sistema de Orientação de Lojas', 'https://sol.gob.org.br/', 'Building2', 120),
    ('SOR - Sistema de Orientação Ritualística', 'https://ritualistica.gob.org.br/', 'ScrollText', 130)
) AS v(title, url, icon_name, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.essential_links LIMIT 1
);
