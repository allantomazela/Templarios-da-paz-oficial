-- Adicionar campo is_private na tabela announcements
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;

-- Atualizar RLS para permitir que membros vejam apenas avisos públicos
DROP POLICY IF EXISTS "Authenticated can read announcements" ON public.announcements;

CREATE POLICY "Authenticated can read announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    -- Admin e editor podem ver todos
    public.is_admin_or_editor() 
    OR 
    -- Membros comuns só veem avisos públicos
    (is_private = FALSE)
  );
