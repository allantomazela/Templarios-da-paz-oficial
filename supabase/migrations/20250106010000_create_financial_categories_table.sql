-- Migration to create financial_categories table
-- This table stores transaction categories

CREATE TABLE IF NOT EXISTS public.financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Receita', 'Despesa')),
  description TEXT,
  color TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique category names per type
  UNIQUE(name, type)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_financial_categories_type ON public.financial_categories(type);
CREATE INDEX IF NOT EXISTS idx_financial_categories_created_by ON public.financial_categories(created_by);

-- Enable RLS
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins and Editors can view all categories
DROP POLICY IF EXISTS "Admins and Editors can view all categories" ON public.financial_categories;
CREATE POLICY "Admins and Editors can view all categories"
  ON public.financial_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can insert categories
DROP POLICY IF EXISTS "Admins and Editors can insert categories" ON public.financial_categories;
CREATE POLICY "Admins and Editors can insert categories"
  ON public.financial_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can update categories
DROP POLICY IF EXISTS "Admins and Editors can update categories" ON public.financial_categories;
CREATE POLICY "Admins and Editors can update categories"
  ON public.financial_categories FOR UPDATE
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

-- Admins and Editors can delete categories
DROP POLICY IF EXISTS "Admins and Editors can delete categories" ON public.financial_categories;
CREATE POLICY "Admins and Editors can delete categories"
  ON public.financial_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_financial_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_financial_categories_updated_at ON public.financial_categories;
CREATE TRIGGER update_financial_categories_updated_at
  BEFORE UPDATE ON public.financial_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_financial_categories_updated_at();
