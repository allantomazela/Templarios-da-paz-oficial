-- Valor total das bebidas informado manualmente no fechamento mensal

ALTER TABLE public.agape_monthly_closings
  ADD COLUMN IF NOT EXISTS total_beverages_spent NUMERIC(10, 2) CHECK (total_beverages_spent IS NULL OR total_beverages_spent >= 0);

COMMENT ON COLUMN public.agape_monthly_closings.total_beverages_spent IS
  'Valor total gasto em bebidas no mês, informado no fechamento';

COMMENT ON COLUMN public.agape_monthly_closings.total_consumed IS
  'Soma das cobranças por irmão (deve conferir com total_beverages_spent)';

COMMENT ON COLUMN public.agape_monthly_closings.total_paid IS
  'Total já recebido dos irmãos (subtrai do total_beverages_spent)';
