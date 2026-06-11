-- Corrige ambiguidade de total_amount em funções PL/pgSQL com RETURNS TABLE
-- (colunas de retorno conflitam com colunas da tabela sem alias)

CREATE OR REPLACE FUNCTION public.get_brother_session_total(
  p_brother_id UUID,
  p_session_id UUID
)
RETURNS TABLE (
  total_items INTEGER,
  total_amount NUMERIC(10, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_items,
    COALESCE(SUM(ac.total_amount), 0)::NUMERIC(10, 2) AS total_amount
  FROM public.agape_consumptions ac
  WHERE ac.brother_id = p_brother_id
    AND ac.session_id = p_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_session_total(
  p_session_id UUID
)
RETURNS TABLE (
  total_brothers INTEGER,
  total_items INTEGER,
  total_amount NUMERIC(10, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT ac.brother_id)::INTEGER AS total_brothers,
    COUNT(*)::INTEGER AS total_items,
    COALESCE(SUM(ac.total_amount), 0)::NUMERIC(10, 2) AS total_amount
  FROM public.agape_consumptions ac
  WHERE ac.session_id = p_session_id;
END;
$$;
