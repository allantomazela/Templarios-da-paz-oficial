-- Registro de alertas de auditoria financeira marcados como verificados (Contas Bancárias)

CREATE TABLE IF NOT EXISTS public.financial_reconciliation_alert_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (
    alert_type IN (
      'unlinked_mensalidade',
      'duplicate_group',
      'same_month_mensalidade',
      'orphan_transaction'
    )
  ),
  alert_key TEXT NOT NULL,
  transaction_fingerprint TEXT NOT NULL,
  note TEXT,
  acknowledged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL
    DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT financial_reconciliation_alert_ack_unique
    UNIQUE (alert_type, alert_key, transaction_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_financial_reconciliation_alert_ack_type_key
  ON public.financial_reconciliation_alert_acknowledgments(alert_type, alert_key);

COMMENT ON TABLE public.financial_reconciliation_alert_acknowledgments IS
  'Alertas de auditoria em Contas Bancárias confirmados pelo tesoureiro/admin após revisão.';

ALTER TABLE public.financial_reconciliation_alert_acknowledgments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Financial reconciliation ack select"
  ON public.financial_reconciliation_alert_acknowledgments;
CREATE POLICY "Financial reconciliation ack select"
  ON public.financial_reconciliation_alert_acknowledgments FOR SELECT
  TO authenticated
  USING (public.can_access_financial_attachments(auth.uid()));

DROP POLICY IF EXISTS "Financial reconciliation ack insert"
  ON public.financial_reconciliation_alert_acknowledgments;
CREATE POLICY "Financial reconciliation ack insert"
  ON public.financial_reconciliation_alert_acknowledgments FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_financial_attachments(auth.uid()));

DROP POLICY IF EXISTS "Financial reconciliation ack delete"
  ON public.financial_reconciliation_alert_acknowledgments;
CREATE POLICY "Financial reconciliation ack delete"
  ON public.financial_reconciliation_alert_acknowledgments FOR DELETE
  TO authenticated
  USING (public.can_access_financial_attachments(auth.uid()));
