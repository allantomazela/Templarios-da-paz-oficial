-- Migration to create financial_goals table
-- This table stores financial goals and targets

CREATE TABLE IF NOT EXISTS public.financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC(10, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'Em Andamento' CHECK (status IN ('Em Andamento', 'Concluída', 'Cancelada')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure current_amount doesn't exceed target_amount (unless goal is completed)
  CONSTRAINT check_current_not_exceed_target CHECK (
    current_amount <= target_amount OR status = 'Concluída'
  ),
  -- Ensure amount is reasonable
  CONSTRAINT check_target_amount_reasonable CHECK (target_amount <= 99999999.99)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_financial_goals_status ON public.financial_goals(status);
CREATE INDEX IF NOT EXISTS idx_financial_goals_deadline ON public.financial_goals(deadline);
CREATE INDEX IF NOT EXISTS idx_financial_goals_created_by ON public.financial_goals(created_by);

-- Enable RLS
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins and Editors can view all goals
DROP POLICY IF EXISTS "Admins and Editors can view all goals" ON public.financial_goals;
CREATE POLICY "Admins and Editors can view all goals"
  ON public.financial_goals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can insert goals
DROP POLICY IF EXISTS "Admins and Editors can insert goals" ON public.financial_goals;
CREATE POLICY "Admins and Editors can insert goals"
  ON public.financial_goals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can update goals
DROP POLICY IF EXISTS "Admins and Editors can update goals" ON public.financial_goals;
CREATE POLICY "Admins and Editors can update goals"
  ON public.financial_goals FOR UPDATE
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

-- Admins and Editors can delete goals
DROP POLICY IF EXISTS "Admins and Editors can delete goals" ON public.financial_goals;
CREATE POLICY "Admins and Editors can delete goals"
  ON public.financial_goals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_financial_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_financial_goals_updated_at ON public.financial_goals;
CREATE TRIGGER update_financial_goals_updated_at
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_financial_goals_updated_at();

-- Function to auto-update goal status when current_amount reaches target
CREATE OR REPLACE FUNCTION public.auto_complete_financial_goal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_amount >= NEW.target_amount AND NEW.status != 'Concluída' THEN
    NEW.status = 'Concluída';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-complete goals
DROP TRIGGER IF EXISTS auto_complete_financial_goal_trigger ON public.financial_goals;
CREATE TRIGGER auto_complete_financial_goal_trigger
  BEFORE INSERT OR UPDATE ON public.financial_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_complete_financial_goal();
