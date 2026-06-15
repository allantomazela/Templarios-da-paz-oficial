-- Permite vários lançamentos de mensalidade por irmão no mesmo mês/ano
-- (pagamentos parciais ou múltiplos pagamentos que somam no saldo).

ALTER TABLE public.contributions
  DROP CONSTRAINT IF EXISTS contributions_brother_id_month_year_key;

CREATE INDEX IF NOT EXISTS idx_contributions_brother_year_month_created
  ON public.contributions (brother_id, year DESC, month DESC, created_at DESC);

COMMENT ON TABLE public.contributions IS
  'Mensalidades dos irmãos. Vários lançamentos por mês/ano são permitidos; cada pagamento confirmado gera receita na tesouraria.';
