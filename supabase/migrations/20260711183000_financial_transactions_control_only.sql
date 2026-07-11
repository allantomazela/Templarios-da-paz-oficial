-- Despesas marcadas como "somente controle" (não afetam saldo de caixa/contas)

ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS is_control_only BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.financial_transactions.is_control_only IS
  'Quando true (apenas Despesa): registro para controle interno, sem impacto na tesouraria.';

ALTER TABLE public.financial_transactions
  DROP CONSTRAINT IF EXISTS financial_transactions_control_only_account_chk;

ALTER TABLE public.financial_transactions
  ADD CONSTRAINT financial_transactions_control_only_account_chk
  CHECK (
    NOT is_control_only
    OR (type = 'Despesa' AND account_id IS NULL)
  );

CREATE INDEX IF NOT EXISTS idx_financial_transactions_control_only
  ON public.financial_transactions(is_control_only)
  WHERE is_control_only = true;

-- View: saldos de conta (exclui despesas só controle)
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
LEFT JOIN public.financial_transactions t
  ON t.account_id = a.id
  AND COALESCE(t.is_control_only, false) = false
GROUP BY a.id, a.name, a.type, a.initial_balance, a.color, a.created_at, a.updated_at;

-- View: resumo mensal (exclui só controle)
CREATE OR REPLACE VIEW public.financial_monthly_summary AS
SELECT
  DATE_TRUNC('month', date) AS month,
  type,
  SUM(amount) AS total_amount,
  COUNT(*) AS transaction_count
FROM public.financial_transactions
WHERE COALESCE(is_control_only, false) = false
GROUP BY DATE_TRUNC('month', date), type
ORDER BY month DESC, type;

-- View: totais por categoria (exclui só controle)
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
WHERE COALESCE(is_control_only, false) = false
GROUP BY category, type
ORDER BY total_amount DESC;

-- Função: saldo de conta até data (exclui só controle)
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
    AND date <= p_date
    AND COALESCE(is_control_only, false) = false;

  RETURN v_initial_balance + v_transaction_total;
END;
$$ LANGUAGE plpgsql STABLE;
