-- =============================================================================
-- NÃO execute este arquivo sozinho se financial_payables ainda não existir.
-- Use: supabase/migrations/APLICAR_FINANCIAL_PAYABLES.sql
--   ou: supabase/migrations/20260703120000_financial_payables.sql (completo)
-- Este script só corrige o trigger updated_at quando a tabela JÁ foi criada.
-- =============================================================================

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
