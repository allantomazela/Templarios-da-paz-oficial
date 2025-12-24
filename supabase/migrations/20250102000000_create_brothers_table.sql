-- Migration to create brothers table with complete information
-- This table stores all information about lodge brothers

CREATE TABLE IF NOT EXISTS public.brothers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  cpf TEXT,
  dob DATE,
  photo_url TEXT,
  
  -- Masonic information
  degree TEXT NOT NULL DEFAULT 'Aprendiz',
  role TEXT NOT NULL DEFAULT 'Irmão',
  status TEXT NOT NULL DEFAULT 'Ativo',
  initiation_date DATE NOT NULL,
  elevation_date DATE,
  exaltation_date DATE,
  attendance_rate INTEGER DEFAULT 0,
  
  -- Additional masonic information
  masonic_registration_number TEXT,
  obedience TEXT, -- Obediência (GOB, GLESP, etc.)
  origin_lodge TEXT, -- Loja de origem
  origin_lodge_number TEXT, -- Número da loja de origem
  current_lodge_number TEXT, -- Número da loja atual
  affiliation_date DATE, -- Data de filiação à loja atual
  regular_status TEXT, -- Status de regularidade (Regular, Irregular, etc.)
  notes TEXT, -- Observações gerais
  
  -- Spouse information
  spouse_name TEXT,
  spouse_dob DATE,
  
  -- Children information (stored as JSONB array)
  children JSONB DEFAULT '[]'::jsonb,
  
  -- Complete address
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zipcode TEXT,
  
  -- Legacy address field (for backward compatibility)
  address TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add additional masonic information columns if they don't exist
ALTER TABLE public.brothers ADD COLUMN IF NOT EXISTS masonic_registration_number TEXT;
ALTER TABLE public.brothers ADD COLUMN IF NOT EXISTS obedience TEXT;
ALTER TABLE public.brothers ADD COLUMN IF NOT EXISTS origin_lodge TEXT;
ALTER TABLE public.brothers ADD COLUMN IF NOT EXISTS origin_lodge_number TEXT;
ALTER TABLE public.brothers ADD COLUMN IF NOT EXISTS current_lodge_number TEXT;
ALTER TABLE public.brothers ADD COLUMN IF NOT EXISTS affiliation_date DATE;
ALTER TABLE public.brothers ADD COLUMN IF NOT EXISTS regular_status TEXT;
ALTER TABLE public.brothers ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_brothers_name ON public.brothers(name);
CREATE INDEX IF NOT EXISTS idx_brothers_email ON public.brothers(email);
CREATE INDEX IF NOT EXISTS idx_brothers_cpf ON public.brothers(cpf);
CREATE INDEX IF NOT EXISTS idx_brothers_status ON public.brothers(status);
CREATE INDEX IF NOT EXISTS idx_brothers_degree ON public.brothers(degree);

-- Enable RLS
ALTER TABLE public.brothers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins and Editors can view all brothers" ON public.brothers;
DROP POLICY IF EXISTS "Admins and Editors can insert brothers" ON public.brothers;
DROP POLICY IF EXISTS "Admins and Editors can update brothers" ON public.brothers;
DROP POLICY IF EXISTS "Admins and Editors can delete brothers" ON public.brothers;

-- Admins and Editors can view all brothers
CREATE POLICY "Admins and Editors can view all brothers"
  ON public.brothers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can insert brothers
CREATE POLICY "Admins and Editors can insert brothers"
  ON public.brothers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can update brothers
CREATE POLICY "Admins and Editors can update brothers"
  ON public.brothers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can delete brothers
CREATE POLICY "Admins and Editors can delete brothers"
  ON public.brothers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_brothers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_brothers_updated_at ON public.brothers;
CREATE TRIGGER update_brothers_updated_at
  BEFORE UPDATE ON public.brothers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_brothers_updated_at();

