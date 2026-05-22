-- Execute no SQL Editor se membros não enxergarem eventos na Agenda

DROP POLICY IF EXISTS "Authenticated can read events" ON public.events;

CREATE POLICY "Authenticated can read events"
  ON public.events FOR SELECT
  TO authenticated
  USING (true);
