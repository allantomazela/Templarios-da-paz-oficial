-- Idempotência em financial_transactions: evita duplicação por duplo envio
-- Coluna opcional: só preenchida em inserts que enviam chave do cliente

ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Índice único: apenas valores não-nulos são únicos (múltiplos NULL permitidos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_transactions_idempotency_key
  ON public.financial_transactions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMENT ON COLUMN public.financial_transactions.idempotency_key IS
  'Chave enviada pelo cliente para evitar duplicação em caso de reenvio (double submit).';
