-- Correção: função update_updated_at_column() não existe neste projeto.
-- Use este script se a migração 20260703120000 falhou no trigger de updated_at.

CREATE OR REPLACE FUNCTION public.update_financial_payables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_financial_payables_updated_at ON public.financial_payables;
CREATE TRIGGER update_financial_payables_updated_at
  BEFORE UPDATE ON public.financial_payables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_financial_payables_updated_at();
