-- Saldo de extrato e observações por conta (Contas Bancárias → Contas e extrato)

CREATE TABLE IF NOT EXISTS public.financial_account_reconciliation_extrato (
  account_id UUID PRIMARY KEY
    REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  extrato_balance NUMERIC(14, 2),
  note TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_financial_account_reconciliation_extrato_updated
  ON public.financial_account_reconciliation_extrato(updated_at DESC);

COMMENT ON TABLE public.financial_account_reconciliation_extrato IS
  'Saldo informado do extrato bancário e observações de divergência por conta (compartilhado entre tesoureiros).';

COMMENT ON COLUMN public.financial_account_reconciliation_extrato.extrato_balance IS
  'Saldo de fechamento informado manualmente ou via importação CSV.';

COMMENT ON COLUMN public.financial_account_reconciliation_extrato.note IS
  'Observação livre explicando divergências entre sistema e extrato.';

ALTER TABLE public.financial_account_reconciliation_extrato ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Financial reconciliation extrato select"
  ON public.financial_account_reconciliation_extrato;
CREATE POLICY "Financial reconciliation extrato select"
  ON public.financial_account_reconciliation_extrato FOR SELECT
  TO authenticated
  USING (public.can_access_financial_attachments(auth.uid()));

DROP POLICY IF EXISTS "Financial reconciliation extrato insert"
  ON public.financial_account_reconciliation_extrato;
CREATE POLICY "Financial reconciliation extrato insert"
  ON public.financial_account_reconciliation_extrato FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_financial_attachments(auth.uid()));

DROP POLICY IF EXISTS "Financial reconciliation extrato update"
  ON public.financial_account_reconciliation_extrato;
CREATE POLICY "Financial reconciliation extrato update"
  ON public.financial_account_reconciliation_extrato FOR UPDATE
  TO authenticated
  USING (public.can_access_financial_attachments(auth.uid()))
  WITH CHECK (public.can_access_financial_attachments(auth.uid()));

DROP POLICY IF EXISTS "Financial reconciliation extrato delete"
  ON public.financial_account_reconciliation_extrato;
CREATE POLICY "Financial reconciliation extrato delete"
  ON public.financial_account_reconciliation_extrato FOR DELETE
  TO authenticated
  USING (public.can_access_financial_attachments(auth.uid()));
