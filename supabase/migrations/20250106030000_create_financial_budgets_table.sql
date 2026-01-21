-- Migration to create financial_budgets table
-- This table stores budget allocations by category

CREATE TABLE IF NOT EXISTS public.financial_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure period_end is after period_start
  CONSTRAINT check_period_valid CHECK (period_end >= period_start),
  -- Ensure amount is reasonable
  CONSTRAINT check_amount_reasonable CHECK (amount <= 99999999.99)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_financial_budgets_category ON public.financial_budgets(category);
CREATE INDEX IF NOT EXISTS idx_financial_budgets_period ON public.financial_budgets(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_financial_budgets_created_by ON public.financial_budgets(created_by);

-- Enable RLS
ALTER TABLE public.financial_budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins and Editors can view all budgets
DROP POLICY IF EXISTS "Admins and Editors can view all budgets" ON public.financial_budgets;
CREATE POLICY "Admins and Editors can view all budgets"
  ON public.financial_budgets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can insert budgets
DROP POLICY IF EXISTS "Admins and Editors can insert budgets" ON public.financial_budgets;
CREATE POLICY "Admins and Editors can insert budgets"
  ON public.financial_budgets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can update budgets
DROP POLICY IF EXISTS "Admins and Editors can update budgets" ON public.financial_budgets;
CREATE POLICY "Admins and Editors can update budgets"
  ON public.financial_budgets FOR UPDATE
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

-- Admins and Editors can delete budgets
DROP POLICY IF EXISTS "Admins and Editors can delete budgets" ON public.financial_budgets;
CREATE POLICY "Admins and Editors can delete budgets"
  ON public.financial_budgets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_financial_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_financial_budgets_updated_at ON public.financial_budgets;
CREATE TRIGGER update_financial_budgets_updated_at
  BEFORE UPDATE ON public.financial_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_financial_budgets_updated_at();
