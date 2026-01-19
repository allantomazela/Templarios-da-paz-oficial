-- Migration to create charity_donations table (Tronco de Beneficência)
-- This table stores charity donations from brothers

CREATE TABLE IF NOT EXISTS public.charity_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brother_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_charity_donations_brother_id ON public.charity_donations(brother_id);
CREATE INDEX IF NOT EXISTS idx_charity_donations_created_at ON public.charity_donations(created_at);

-- Enable RLS
ALTER TABLE public.charity_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Brothers can view their own donations
DROP POLICY IF EXISTS "Brothers can view their own donations" ON public.charity_donations;
CREATE POLICY "Brothers can view their own donations"
  ON public.charity_donations FOR SELECT
  TO authenticated
  USING (brother_id = auth.uid());

-- Admins and Editors can view all donations
DROP POLICY IF EXISTS "Admins and Editors can view all donations" ON public.charity_donations;
CREATE POLICY "Admins and Editors can view all donations"
  ON public.charity_donations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can insert donations
DROP POLICY IF EXISTS "Admins and Editors can insert donations" ON public.charity_donations;
CREATE POLICY "Admins and Editors can insert donations"
  ON public.charity_donations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can update donations
DROP POLICY IF EXISTS "Admins and Editors can update donations" ON public.charity_donations;
CREATE POLICY "Admins and Editors can update donations"
  ON public.charity_donations FOR UPDATE
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

-- Admins and Editors can delete donations
DROP POLICY IF EXISTS "Admins and Editors can delete donations" ON public.charity_donations;
CREATE POLICY "Admins and Editors can delete donations"
  ON public.charity_donations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_charity_donations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_charity_donations_updated_at ON public.charity_donations;
CREATE TRIGGER update_charity_donations_updated_at
  BEFORE UPDATE ON public.charity_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_charity_donations_updated_at();
