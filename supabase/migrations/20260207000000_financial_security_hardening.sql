-- Correções de segurança do módulo financeiro (auditoria QA/Segurança)
-- 1) Revogar exposição de views/funções a todos autenticados
-- 2) Restringir INSERT em financial_audit_log apenas ao trigger (SECURITY DEFINER)
-- 3) Definir search_path em funções SECURITY DEFINER

-- ========== 1) REVOGAR GRANTS que expõem dados a qualquer authenticated ==========
REVOKE SELECT ON public.financial_account_balances FROM authenticated;
REVOKE SELECT ON public.financial_monthly_summary FROM authenticated;
REVOKE SELECT ON public.financial_category_totals FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_account_balance(UUID, DATE) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_period_totals(DATE, DATE) FROM authenticated;

-- ========== 2) AUDIT LOG: só o trigger (definer) pode inserir ==========
DROP POLICY IF EXISTS "System can insert audit logs" ON public.financial_audit_log;

-- Política: apenas o dono da função create_financial_audit_log pode inserir (trigger SECURITY DEFINER)
CREATE POLICY "Allow audit insert by trigger definer only"
  ON public.financial_audit_log FOR INSERT
  WITH CHECK (
    current_user = (
      SELECT pg_catalog.pg_get_userbyid(proowner)
      FROM pg_catalog.pg_proc
      WHERE proname = 'create_financial_audit_log'
      LIMIT 1
    )
  );

-- ========== 3) search_path em funções SECURITY DEFINER (evitar search_path hijack) ==========
CREATE OR REPLACE FUNCTION public.get_account_balance(
  p_account_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC(10, 2) AS $$
DECLARE
  v_initial_balance NUMERIC(10, 2);
  v_transaction_total NUMERIC(10, 2);
BEGIN
  SELECT initial_balance INTO v_initial_balance
  FROM public.financial_accounts
  WHERE id = p_account_id;

  IF v_initial_balance IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(
    SUM(
      CASE
        WHEN type = 'Receita' THEN amount
        WHEN type = 'Despesa' THEN -amount
        ELSE 0
      END
    ),
    0
  ) INTO v_transaction_total
  FROM public.financial_transactions
  WHERE account_id = p_account_id
    AND date <= p_date;

  RETURN v_initial_balance + v_transaction_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_period_totals(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_income NUMERIC(10, 2),
  total_expense NUMERIC(10, 2),
  net_amount NUMERIC(10, 2),
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN type = 'Receita' THEN amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN type = 'Despesa' THEN amount ELSE 0 END), 0) AS total_expense,
    COALESCE(SUM(
      CASE
        WHEN type = 'Receita' THEN amount
        WHEN type = 'Despesa' THEN -amount
        ELSE 0
      END
    ), 0) AS net_amount,
    COUNT(*)::BIGINT AS transaction_count
  FROM public.financial_transactions
  WHERE date >= p_start_date AND date <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.create_financial_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_old_values JSONB;
  v_new_values JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old_values := to_jsonb(OLD);
    v_new_values := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    v_action := 'INSERT';
    v_old_values := NULL;
    v_new_values := to_jsonb(NEW);
  END IF;

  INSERT INTO public.financial_audit_log (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    changed_by
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE((NEW.id)::UUID, (OLD.id)::UUID),
    v_action,
    v_old_values,
    v_new_values,
    auth.uid()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
