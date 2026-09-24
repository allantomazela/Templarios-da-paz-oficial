-- Mestre de Banquete: acesso total ao módulo Ágape, sem outros módulos pelo cargo.
-- Também libera o reset operacional do Ágape para can_manage_agape.

CREATE OR REPLACE FUNCTION public.has_module_permission(
  p_user_id uuid,
  p_module text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_position public.lodge_position_type;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND email = 'allantomazela@gmail.com'
  ) THEN
    RETURN TRUE;
  END IF;

  v_position := public.get_user_current_position(p_user_id);

  IF v_position IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_position = 'veneravel_mestre' THEN
    RETURN TRUE;
  END IF;

  CASE v_position
    WHEN 'secretario' THEN
      RETURN p_module IN ('secretariat', 'agenda', 'library', 'agape');
    WHEN 'chanceler' THEN
      RETURN p_module IN ('chancellor', 'agenda', 'agape');
    WHEN 'tesoureiro' THEN
      RETURN p_module IN ('financial', 'agape');
    WHEN 'orador' THEN
      RETURN p_module IN ('reports', 'agape');
    WHEN 'mestre_banquete' THEN
      -- Somente o módulo Ágape (controle total operacional + fechamento via can_manage_agape)
      RETURN p_module = 'agape';
    ELSE
      RETURN FALSE;
  END CASE;
END;
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
  IF auth.uid() IS NOT NULL
     AND current_user NOT IN ('postgres', 'supabase_admin')
     AND NOT (
       public.is_admin_or_editor()
       OR public.can_manage_agape(auth.uid())
     ) THEN
    RAISE EXCEPTION 'Apenas o Mestre de Banquete ou a administração podem resetar os lançamentos do Ágape.';
  END IF;

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

COMMENT ON FUNCTION public.has_module_permission(uuid, text) IS
  'Permissões por cargo. Mestre de Banquete: somente módulo agape.';

COMMENT ON FUNCTION public.reset_agape_operational_data() IS
  'Remove lançamentos do Ágape. Permitido para administração e can_manage_agape (Mestre de Banquete/VM).';
