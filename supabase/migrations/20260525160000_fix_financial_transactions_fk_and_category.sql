-- Corrige FK de conta (financial_accounts) e preenche category_id a partir do nome da categoria.

ALTER TABLE public.financial_transactions
  DROP CONSTRAINT IF EXISTS financial_transactions_account_id_fkey;

ALTER TABLE public.financial_transactions
  ADD CONSTRAINT financial_transactions_account_id_fkey
  FOREIGN KEY (account_id)
  REFERENCES public.financial_accounts(id)
  ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.financial_transactions_set_category_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category_id IS NULL AND NEW.category IS NOT NULL THEN
    SELECT fc.id
    INTO NEW.category_id
    FROM public.financial_categories fc
    WHERE fc.name = NEW.category
      AND fc.type = NEW.type
    LIMIT 1;
  END IF;

  IF NEW.category_id IS NULL THEN
    RAISE EXCEPTION 'Categoria financeira obrigatória (category_id)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS financial_transactions_set_category_id_trigger
  ON public.financial_transactions;

CREATE TRIGGER financial_transactions_set_category_id_trigger
  BEFORE INSERT OR UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.financial_transactions_set_category_id();
