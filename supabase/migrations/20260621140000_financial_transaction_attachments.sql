-- Comprovantes de transações financeiras (NF, recibos, cupons) — acesso restrito a admin e tesoureiro

ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS attachment_notes TEXT;

COMMENT ON COLUMN public.financial_transactions.attachment_notes IS
  'Observações sobre comprovantes (ex.: despesa sem NF anexada).';

CREATE OR REPLACE FUNCTION public.can_access_financial_attachments(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
    OR public.has_module_permission(p_user_id, 'financial');
$$;

CREATE TABLE IF NOT EXISTS public.financial_transaction_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL
    REFERENCES public.financial_transactions(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL
    CHECK (document_type IN ('nota_fiscal', 'recibo', 'cupom_fiscal', 'outro')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
    DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT financial_transaction_attachments_file_path_key UNIQUE (file_path)
);

CREATE INDEX IF NOT EXISTS idx_financial_transaction_attachments_transaction_id
  ON public.financial_transaction_attachments(transaction_id);

CREATE INDEX IF NOT EXISTS idx_financial_transaction_attachments_created_at
  ON public.financial_transaction_attachments(created_at DESC);

ALTER TABLE public.financial_transaction_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Financial attachments select" ON public.financial_transaction_attachments;
CREATE POLICY "Financial attachments select"
  ON public.financial_transaction_attachments FOR SELECT
  TO authenticated
  USING (public.can_access_financial_attachments(auth.uid()));

DROP POLICY IF EXISTS "Financial attachments insert" ON public.financial_transaction_attachments;
CREATE POLICY "Financial attachments insert"
  ON public.financial_transaction_attachments FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_financial_attachments(auth.uid()));

DROP POLICY IF EXISTS "Financial attachments delete" ON public.financial_transaction_attachments;
CREATE POLICY "Financial attachments delete"
  ON public.financial_transaction_attachments FOR DELETE
  TO authenticated
  USING (public.can_access_financial_attachments(auth.uid()));

DROP POLICY IF EXISTS "Financial attachments update" ON public.financial_transaction_attachments;
CREATE POLICY "Financial attachments update"
  ON public.financial_transaction_attachments FOR UPDATE
  TO authenticated
  USING (public.can_access_financial_attachments(auth.uid()))
  WITH CHECK (public.can_access_financial_attachments(auth.uid()));

INSERT INTO storage.buckets (id, name, public)
VALUES ('financial-documents', 'financial-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Financial treasurers read documents" ON storage.objects;
CREATE POLICY "Financial treasurers read documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'financial-documents'
    AND public.can_access_financial_attachments(auth.uid())
  );

DROP POLICY IF EXISTS "Financial treasurers upload documents" ON storage.objects;
CREATE POLICY "Financial treasurers upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'financial-documents'
    AND name LIKE 'transactions/%'
    AND public.can_access_financial_attachments(auth.uid())
  );

DROP POLICY IF EXISTS "Financial treasurers update documents" ON storage.objects;
CREATE POLICY "Financial treasurers update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'financial-documents'
    AND public.can_access_financial_attachments(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'financial-documents'
    AND public.can_access_financial_attachments(auth.uid())
  );

DROP POLICY IF EXISTS "Financial treasurers delete documents" ON storage.objects;
CREATE POLICY "Financial treasurers delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'financial-documents'
    AND public.can_access_financial_attachments(auth.uid())
  );

COMMENT ON TABLE public.financial_transaction_attachments IS
  'Anexos de comprovantes vinculados a transações financeiras (bucket privado financial-documents).';
