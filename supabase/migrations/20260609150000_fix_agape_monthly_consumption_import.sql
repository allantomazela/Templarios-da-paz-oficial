-- Corrige importação do fechamento: inclui todas as sessões do mês (aberta, fechada, finalizada)

CREATE OR REPLACE FUNCTION public.get_agape_monthly_consumption_totals(
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE (
  brother_id UUID,
  brother_name TEXT,
  total_amount NUMERIC(10, 2),
  total_items BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ac.brother_id,
    COALESCE(p.full_name, 'Sem nome') AS brother_name,
    COALESCE(SUM(ac.total_amount), 0)::NUMERIC(10, 2) AS total_amount,
    COALESCE(SUM(ac.quantity), 0)::BIGINT AS total_items
  FROM public.agape_consumptions ac
  INNER JOIN public.agape_sessions s ON s.id = ac.session_id
  LEFT JOIN public.profiles p ON p.id = ac.brother_id
  WHERE s.date >= make_date(p_year, p_month, 1)
    AND s.date < (make_date(p_year, p_month, 1) + INTERVAL '1 month')::date
  GROUP BY ac.brother_id, p.full_name
  ORDER BY brother_name;
$$;

COMMENT ON FUNCTION public.get_agape_monthly_consumption_totals(INTEGER, INTEGER) IS
  'Totais de consumo por irmão no mês — todas as sessões com lançamentos no período';

-- Tesouraria pode ler consumos para importação no fechamento
DROP POLICY IF EXISTS "Financial staff can view agape consumptions" ON public.agape_consumptions;
CREATE POLICY "Financial staff can view agape consumptions"
  ON public.agape_consumptions FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    ) OR
    public.has_module_permission(auth.uid(), 'financial') OR
    public.has_module_permission(auth.uid(), 'agape')
  );
