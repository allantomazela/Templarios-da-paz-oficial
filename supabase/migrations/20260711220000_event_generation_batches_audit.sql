-- Auditoria de lotes de geração automática de sessões
CREATE TABLE IF NOT EXISTS public.event_generation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sessions_count INT NOT NULL DEFAULT 0,
  first_date DATE,
  last_date DATE,
  undone_at TIMESTAMPTZ,
  undone_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_event_generation_batches_created_at
  ON public.event_generation_batches (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_generation_batches_active
  ON public.event_generation_batches (undone_at)
  WHERE undone_at IS NULL;

COMMENT ON TABLE public.event_generation_batches IS 'Registro de auditoria de gerações automáticas de sessões na agenda';
COMMENT ON COLUMN public.event_generation_batches.undone_at IS 'Preenchido quando o lote é desfeito (sessões removidas)';

-- Backfill do lote já existente em produção
INSERT INTO public.event_generation_batches (id, created_at, sessions_count, first_date, last_date)
SELECT
  e.generated_batch_id,
  min(e.created_at),
  count(*)::int,
  min(e.date),
  max(e.date)
FROM public.events e
WHERE e.generated_batch_id IS NOT NULL
GROUP BY e.generated_batch_id
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_generated_batch_id_fkey;

ALTER TABLE public.events
  ADD CONSTRAINT events_generated_batch_id_fkey
  FOREIGN KEY (generated_batch_id)
  REFERENCES public.event_generation_batches(id)
  ON DELETE SET NULL;

ALTER TABLE public.event_generation_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and Editors can manage generation batches"
  ON public.event_generation_batches;

CREATE POLICY "Admins and Editors can manage generation batches"
  ON public.event_generation_batches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Authenticated can read generation batches"
  ON public.event_generation_batches;

CREATE POLICY "Authenticated can read generation batches"
  ON public.event_generation_batches FOR SELECT
  TO authenticated
  USING (true);
