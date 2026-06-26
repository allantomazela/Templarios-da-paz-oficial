-- Miniaturas de comprovantes financeiros (imagens) para listagem mais rápida

ALTER TABLE public.financial_transaction_attachments
  ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;

COMMENT ON COLUMN public.financial_transaction_attachments.thumbnail_path IS
  'Caminho da miniatura WebP no bucket financial-documents (transactions/{id}/thumbs/).';
