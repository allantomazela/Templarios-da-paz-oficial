-- Tabela de itens da Biblioteca Virtual (PDFs para download pelos irmãos).
-- Inserção/edição/exclusão: apenas admin ou editor (Irmão Secretário).
-- Leitura e download: todos os autenticados (respeitando grau no app).

CREATE TABLE IF NOT EXISTS public.library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'PDF' CHECK (type IN ('PDF', 'Imagem', 'Video', 'Texto')),
  degree TEXT NOT NULL CHECK (degree IN ('Aprendiz', 'Companheiro', 'Mestre')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  added_at DATE NOT NULL DEFAULT CURRENT_DATE,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_library_items_degree ON public.library_items(degree);
CREATE INDEX IF NOT EXISTS idx_library_items_added_at ON public.library_items(added_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_items_uploaded_by ON public.library_items(uploaded_by);

ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view library items" ON public.library_items;
DROP POLICY IF EXISTS "Admin and Editor can insert library items" ON public.library_items;
DROP POLICY IF EXISTS "Admin and Editor can update library items" ON public.library_items;
DROP POLICY IF EXISTS "Admin and Editor can delete library items" ON public.library_items;

-- Leitura: todos autenticados (acesso por grau é validado no app)
CREATE POLICY "Authenticated can view library items"
  ON public.library_items FOR SELECT
  TO authenticated
  USING (true);

-- Inserção/atualização/exclusão: apenas admin ou editor (Secretário)
CREATE POLICY "Admin and Editor can insert library items"
  ON public.library_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_editor());

CREATE POLICY "Admin and Editor can update library items"
  ON public.library_items FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

CREATE POLICY "Admin and Editor can delete library items"
  ON public.library_items FOR DELETE
  TO authenticated
  USING (public.is_admin_or_editor());
