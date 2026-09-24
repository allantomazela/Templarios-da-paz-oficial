-- Permite ao Mestre de Banquete / diretoria / editor listar irmãos aprovados
-- para lançamento manual de consumos no Ágape (antes só admin via RLS).

DROP POLICY IF EXISTS "Agape recorders can read approved profiles" ON public.profiles;

CREATE POLICY "Agape recorders can read approved profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    status = 'approved'
    AND public.can_record_agape_consumption(auth.uid())
  );

COMMENT ON POLICY "Agape recorders can read approved profiles" ON public.profiles IS
  'Mestre de Banquete, VM, diretoria e editor podem listar membros aprovados para lançar consumos do Ágape.';
