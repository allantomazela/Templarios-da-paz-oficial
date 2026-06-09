-- Vincula mensalidades (contributions) à tesouraria (financial_transactions)

ALTER TABLE public.contributions
  ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contributions_transaction_id
  ON public.contributions(transaction_id);

CREATE INDEX IF NOT EXISTS idx_contributions_account_id
  ON public.contributions(account_id);

-- Categoria padrão para receitas de mensalidade
INSERT INTO public.financial_categories (name, type, description, color)
VALUES (
  'Mensalidade',
  'Receita',
  'Contribuições mensais dos irmãos',
  '#16a34a'
)
ON CONFLICT (name, type) DO NOTHING;
