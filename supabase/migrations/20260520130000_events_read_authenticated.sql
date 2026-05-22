-- Permite que membros autenticados vejam eventos na Agenda e no Painel

DROP POLICY IF EXISTS "Authenticated can read events" ON public.events;

CREATE POLICY "Authenticated can read events"
  ON public.events FOR SELECT
  TO authenticated
  USING (true);
