-- Migration to create financial_transactions table
-- This table stores all financial transactions (income and expenses)

CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Receita', 'Despesa')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure description is not empty
  CONSTRAINT check_description_not_empty CHECK (LENGTH(TRIM(description)) > 0),
  -- Ensure amount is reasonable (max 99999999.99)
  CONSTRAINT check_amount_reasonable CHECK (amount <= 99999999.99)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON public.financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_account_id ON public.financial_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_created_by ON public.financial_transactions(created_by);
-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date_type ON public.financial_transactions(date DESC, type);

-- Enable RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins and Editors can view all transactions
DROP POLICY IF EXISTS "Admins and Editors can view all transactions" ON public.financial_transactions;
CREATE POLICY "Admins and Editors can view all transactions"
  ON public.financial_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can insert transactions
DROP POLICY IF EXISTS "Admins and Editors can insert transactions" ON public.financial_transactions;
CREATE POLICY "Admins and Editors can insert transactions"
  ON public.financial_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can update transactions
DROP POLICY IF EXISTS "Admins and Editors can update transactions" ON public.financial_transactions;
CREATE POLICY "Admins and Editors can update transactions"
  ON public.financial_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can delete transactions
DROP POLICY IF EXISTS "Admins and Editors can delete transactions" ON public.financial_transactions;
CREATE POLICY "Admins and Editors can delete transactions"
  ON public.financial_transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_financial_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON public.financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_financial_transactions_updated_at();

-- Function to validate transaction date (cannot be in the future)
CREATE OR REPLACE FUNCTION public.validate_transaction_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Data da transação não pode ser no futuro';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate transaction date
DROP TRIGGER IF EXISTS validate_transaction_date_trigger ON public.financial_transactions;
CREATE TRIGGER validate_transaction_date_trigger
  BEFORE INSERT OR UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_transaction_date();
