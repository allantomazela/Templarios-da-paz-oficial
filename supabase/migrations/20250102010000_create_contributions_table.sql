-- Migration to create contributions table (Mensalidades)
-- This table stores monthly contributions from brothers

CREATE TABLE IF NOT EXISTS public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brother_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pago', 'Pendente', 'Atrasado')),
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique contribution per brother per month/year
  UNIQUE(brother_id, month, year)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_contributions_brother_id ON public.contributions(brother_id);
CREATE INDEX IF NOT EXISTS idx_contributions_year_month ON public.contributions(year, month);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON public.contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_payment_date ON public.contributions(payment_date);

-- Enable RLS
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Brothers can view their own contributions
DROP POLICY IF EXISTS "Brothers can view their own contributions" ON public.contributions;
CREATE POLICY "Brothers can view their own contributions"
  ON public.contributions FOR SELECT
  TO authenticated
  USING (brother_id = auth.uid());

-- Admins and Editors can view all contributions
DROP POLICY IF EXISTS "Admins and Editors can view all contributions" ON public.contributions;
CREATE POLICY "Admins and Editors can view all contributions"
  ON public.contributions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can insert contributions
DROP POLICY IF EXISTS "Admins and Editors can insert contributions" ON public.contributions;
CREATE POLICY "Admins and Editors can insert contributions"
  ON public.contributions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can update contributions
DROP POLICY IF EXISTS "Admins and Editors can update contributions" ON public.contributions;
CREATE POLICY "Admins and Editors can update contributions"
  ON public.contributions FOR UPDATE
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

-- Admins and Editors can delete contributions
DROP POLICY IF EXISTS "Admins and Editors can delete contributions" ON public.contributions;
CREATE POLICY "Admins and Editors can delete contributions"
  ON public.contributions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_contributions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_contributions_updated_at ON public.contributions;
CREATE TRIGGER update_contributions_updated_at
  BEFORE UPDATE ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contributions_updated_at();
