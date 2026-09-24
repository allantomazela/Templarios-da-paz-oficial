-- Corrige reset do Ágape: contas a pagar "Pago" não podem receber transaction_id NULL
-- (check_payable_paid_has_transaction). Desvincula/cancela antes de apagar as despesas.

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
  IF auth.uid() IS NOT NULL
     AND current_user NOT IN ('postgres', 'supabase_admin')
     AND NOT public.is_admin_or_editor() THEN
    RAISE EXCEPTION 'Apenas a administração pode resetar os lançamentos do Ágape.';
  END IF;

  -- Contas a pagar 'Pago' não podem perder transaction_id (CHECK).
  -- Desvincula/cancela antes de apagar as despesas do Ágape.
  UPDATE public.financial_payables fp
  SET
    status = 'Cancelado',
    transaction_id = NULL,
    updated_at = now()
  WHERE fp.transaction_id IN (
    SELECT ft.id
    FROM public.financial_transactions ft
    WHERE public.is_agape_financial_transaction(ft)
  );

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
  'Remove lançamentos do Ágape (consumos, sessões, cardápio, cobranças e despesas vinculadas). Desvincula contas a pagar antes do delete.';
