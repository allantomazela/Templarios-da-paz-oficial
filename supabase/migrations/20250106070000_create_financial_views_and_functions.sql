-- Migration to create useful views and functions for financial data
-- These views optimize common queries and calculations

-- View: Account balances (calculated from transactions)
CREATE OR REPLACE VIEW public.financial_account_balances AS
SELECT 
  a.id,
  a.name,
  a.type,
  a.initial_balance,
  a.color,
  COALESCE(
    a.initial_balance + 
    SUM(
      CASE 
        WHEN t.type = 'Receita' THEN t.amount
        WHEN t.type = 'Despesa' THEN -t.amount
        ELSE 0
      END
    ),
    a.initial_balance
  ) AS current_balance,
  COUNT(t.id) AS transaction_count,
  a.created_at,
  a.updated_at
FROM public.financial_accounts a
LEFT JOIN public.financial_transactions t ON t.account_id = a.id
GROUP BY a.id, a.name, a.type, a.initial_balance, a.color, a.created_at, a.updated_at;

-- View: Monthly financial summary
CREATE OR REPLACE VIEW public.financial_monthly_summary AS
SELECT 
  DATE_TRUNC('month', date) AS month,
  type,
  SUM(amount) AS total_amount,
  COUNT(*) AS transaction_count
FROM public.financial_transactions
GROUP BY DATE_TRUNC('month', date), type
ORDER BY month DESC, type;

-- View: Category totals
CREATE OR REPLACE VIEW public.financial_category_totals AS
SELECT 
  category,
  type,
  SUM(amount) AS total_amount,
  COUNT(*) AS transaction_count,
  AVG(amount) AS average_amount,
  MIN(amount) AS min_amount,
  MAX(amount) AS max_amount
FROM public.financial_transactions
GROUP BY category, type
ORDER BY total_amount DESC;

-- Function: Get account balance (with optional date filter)
CREATE OR REPLACE FUNCTION public.get_account_balance(
  p_account_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC(10, 2) AS $$
DECLARE
  v_initial_balance NUMERIC(10, 2);
  v_transaction_total NUMERIC(10, 2);
BEGIN
  -- Get initial balance
  SELECT initial_balance INTO v_initial_balance
  FROM public.financial_accounts
  WHERE id = p_account_id;
  
  IF v_initial_balance IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Get transaction total up to date
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get period totals (income and expense)
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
    COUNT(*) AS transaction_count
  FROM public.financial_transactions
  WHERE date >= p_start_date AND date <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to views and functions
GRANT SELECT ON public.financial_account_balances TO authenticated;
GRANT SELECT ON public.financial_monthly_summary TO authenticated;
GRANT SELECT ON public.financial_category_totals TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_account_balance(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_period_totals(DATE, DATE) TO authenticated;
