-- Migration to create financial_accounts table
-- This table stores bank accounts and cash registers

CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Corrente', 'Poupança', 'Caixa', 'Investimento')),
  initial_balance NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (initial_balance >= 0),
  color TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique account names
  UNIQUE(name)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_financial_accounts_type ON public.financial_accounts(type);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_created_by ON public.financial_accounts(created_by);

-- Enable RLS
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins and Editors can view all accounts
DROP POLICY IF EXISTS "Admins and Editors can view all accounts" ON public.financial_accounts;
CREATE POLICY "Admins and Editors can view all accounts"
  ON public.financial_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can insert accounts
DROP POLICY IF EXISTS "Admins and Editors can insert accounts" ON public.financial_accounts;
CREATE POLICY "Admins and Editors can insert accounts"
  ON public.financial_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can update accounts
DROP POLICY IF EXISTS "Admins and Editors can update accounts" ON public.financial_accounts;
CREATE POLICY "Admins and Editors can update accounts"
  ON public.financial_accounts FOR UPDATE
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

-- Admins and Editors can delete accounts
DROP POLICY IF EXISTS "Admins and Editors can delete accounts" ON public.financial_accounts;
CREATE POLICY "Admins and Editors can delete accounts"
  ON public.financial_accounts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_financial_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_financial_accounts_updated_at ON public.financial_accounts;
CREATE TRIGGER update_financial_accounts_updated_at
  BEFORE UPDATE ON public.financial_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_financial_accounts_updated_at();
