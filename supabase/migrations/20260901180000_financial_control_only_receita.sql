-- Permite receitas somente controle (mesma regra das despesas: sem conta bancária).

COMMENT ON COLUMN public.financial_transactions.is_control_only IS
  'Quando true: registro para controle interno, sem impacto na tesouraria (Receita ou Despesa).';

ALTER TABLE public.financial_transactions
  DROP CONSTRAINT IF EXISTS financial_transactions_control_only_account_chk;

ALTER TABLE public.financial_transactions
  ADD CONSTRAINT financial_transactions_control_only_account_chk
  CHECK (
    NOT is_control_only
    OR account_id IS NULL
  );
