-- Migration to create audit triggers for financial tables
-- This migration should run after all financial tables are created

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS audit_financial_accounts ON public.financial_accounts;
DROP TRIGGER IF EXISTS audit_financial_categories ON public.financial_categories;
DROP TRIGGER IF EXISTS audit_financial_transactions ON public.financial_transactions;
DROP TRIGGER IF EXISTS audit_financial_budgets ON public.financial_budgets;
DROP TRIGGER IF EXISTS audit_financial_goals ON public.financial_goals;
DROP TRIGGER IF EXISTS audit_contributions ON public.contributions;

-- Create audit triggers for financial_accounts
CREATE TRIGGER audit_financial_accounts
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_financial_audit_log();

-- Create audit triggers for financial_categories
CREATE TRIGGER audit_financial_categories
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.create_financial_audit_log();

-- Create audit triggers for financial_transactions
CREATE TRIGGER audit_financial_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_financial_audit_log();

-- Create audit triggers for financial_budgets
CREATE TRIGGER audit_financial_budgets
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.create_financial_audit_log();

-- Create audit triggers for financial_goals
CREATE TRIGGER audit_financial_goals
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.create_financial_audit_log();

-- Create audit trigger for contributions (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'contributions'
  ) THEN
    DROP TRIGGER IF EXISTS audit_contributions ON public.contributions;
    CREATE TRIGGER audit_contributions
      AFTER INSERT OR UPDATE OR DELETE ON public.contributions
      FOR EACH ROW
      EXECUTE FUNCTION public.create_financial_audit_log();
  END IF;
END $$;
