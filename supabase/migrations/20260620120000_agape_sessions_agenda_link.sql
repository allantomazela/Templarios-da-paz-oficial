-- Vincula sessões de ágape a eventos da Agenda (importação seletiva + sessões manuais)

ALTER TABLE public.agape_sessions
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source TEXT;

UPDATE public.agape_sessions
SET source = 'manual'
WHERE source IS NULL;

ALTER TABLE public.agape_sessions
  ALTER COLUMN source SET DEFAULT 'manual',
  ALTER COLUMN source SET NOT NULL;

ALTER TABLE public.agape_sessions
  DROP CONSTRAINT IF EXISTS unique_session_date;

ALTER TABLE public.agape_sessions
  DROP CONSTRAINT IF EXISTS agape_sessions_source_check;

ALTER TABLE public.agape_sessions
  ADD CONSTRAINT agape_sessions_source_check
  CHECK (source IN ('agenda', 'manual'));

ALTER TABLE public.agape_sessions
  DROP CONSTRAINT IF EXISTS agape_sessions_source_event_check;

ALTER TABLE public.agape_sessions
  ADD CONSTRAINT agape_sessions_source_event_check
  CHECK (
    (source = 'agenda' AND event_id IS NOT NULL)
    OR source = 'manual'
  );

CREATE UNIQUE INDEX IF NOT EXISTS uniq_agape_sessions_event_id
  ON public.agape_sessions(event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agape_sessions_event_id
  ON public.agape_sessions(event_id);

COMMENT ON COLUMN public.agape_sessions.event_id IS 'Evento da Agenda vinculado (quando source = agenda)';
COMMENT ON COLUMN public.agape_sessions.source IS 'Origem da sessão: agenda (importada) ou manual';

CREATE OR REPLACE FUNCTION public.agape_session_on_event_unlink()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.event_id IS NULL AND OLD.event_id IS NOT NULL THEN
    NEW.source := 'manual';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agape_session_on_event_unlink ON public.agape_sessions;

CREATE TRIGGER trg_agape_session_on_event_unlink
  BEFORE UPDATE ON public.agape_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.agape_session_on_event_unlink();
