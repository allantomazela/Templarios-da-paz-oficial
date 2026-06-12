-- Função administrativa para zerar lançamentos operacionais do módulo Ágape.
-- Execute no SQL Editor: SELECT * FROM public.reset_agape_operational_data();

CREATE OR REPLACE FUNCTION public.is_agape_financial_transaction(p_tx public.financial_transactions)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    p_tx.category ILIKE '%agape%'
    OR p_tx.category ILIKE '%ágape%'
    OR p_tx.description ILIKE '%agape%'
    OR p_tx.description ILIKE '%ágape%'
    OR EXISTS (
      SELECT 1
      FROM public.financial_categories fc
      WHERE fc.id = p_tx.category_id
        AND (fc.name ILIKE '%agape%' OR fc.name ILIKE '%ágape%')
    )
    OR EXISTS (
      SELECT 1
      FROM public.agape_brother_charges ac
      WHERE ac.transaction_id = p_tx.id
    );
$$;

CREATE OR REPLACE FUNCTION public.reset_agape_operational_data()
RETURNS TABLE (
  transactions_removed BIGINT,
  charges_removed BIGINT,
  closings_removed BIGINT,
  consumptions_removed BIGINT,
  sessions_removed BIGINT,
  menu_items_removed BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transactions BIGINT := 0;
  v_charges BIGINT := 0;
  v_closings BIGINT := 0;
  v_consumptions BIGINT := 0;
  v_sessions BIGINT := 0;
  v_menu BIGINT := 0;
BEGIN
  -- SQL Editor (postgres) e service role podem executar; usuários autenticados só admin/editor
  IF auth.uid() IS NOT NULL
     AND current_user NOT IN ('postgres', 'supabase_admin')
     AND NOT public.is_admin_or_editor() THEN
    RAISE EXCEPTION 'Apenas a administração pode resetar os lançamentos do Ágape.';
  END IF;

  DELETE FROM public.financial_transactions ft
  WHERE public.is_agape_financial_transaction(ft);
  GET DIAGNOSTICS v_transactions = ROW_COUNT;

  DELETE FROM public.agape_brother_charges;
  GET DIAGNOSTICS v_charges = ROW_COUNT;

  DELETE FROM public.agape_monthly_closings;
  GET DIAGNOSTICS v_closings = ROW_COUNT;

  DELETE FROM public.agape_consumptions;
  GET DIAGNOSTICS v_consumptions = ROW_COUNT;

  DELETE FROM public.agape_sessions;
  GET DIAGNOSTICS v_sessions = ROW_COUNT;

  DELETE FROM public.agape_menu_items;
  GET DIAGNOSTICS v_menu = ROW_COUNT;

  RETURN QUERY
  SELECT
    v_transactions,
    v_charges,
    v_closings,
    v_consumptions,
    v_sessions,
    v_menu;
END;
$$;

COMMENT ON FUNCTION public.reset_agape_operational_data() IS
  'Remove todos os lançamentos do Ágape (consumos, sessões, fechamento e receitas vinculadas). Uso administrativo.';

REVOKE ALL ON FUNCTION public.reset_agape_operational_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_agape_operational_data() TO authenticated;
