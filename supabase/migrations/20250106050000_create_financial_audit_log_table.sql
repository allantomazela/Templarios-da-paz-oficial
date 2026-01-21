-- Migration to create financial_audit_log table
-- This table stores audit trail for all financial operations

CREATE TABLE IF NOT EXISTS public.financial_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure table_name is valid
  CONSTRAINT check_table_name_valid CHECK (
    table_name IN (
      'financial_accounts',
      'financial_categories',
      'financial_transactions',
      'financial_budgets',
      'financial_goals',
      'contributions'
    )
  )
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_financial_audit_log_table_name ON public.financial_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_financial_audit_log_record_id ON public.financial_audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_financial_audit_log_action ON public.financial_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_financial_audit_log_changed_by ON public.financial_audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_financial_audit_log_changed_at ON public.financial_audit_log(changed_at DESC);
-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_financial_audit_log_table_record ON public.financial_audit_log(table_name, record_id);

-- Enable RLS
ALTER TABLE public.financial_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only Admins can view audit logs (highly sensitive)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.financial_audit_log;
CREATE POLICY "Admins can view audit logs"
  ON public.financial_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert audit logs (via triggers)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.financial_audit_log;
CREATE POLICY "System can insert audit logs"
  ON public.financial_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION public.create_financial_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_old_values JSONB;
  v_new_values JSONB;
  v_action TEXT;
BEGIN
  -- Determine action type
  IF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old_values := to_jsonb(OLD);
    v_new_values := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    v_action := 'INSERT';
    v_old_values := NULL;
    v_new_values := to_jsonb(NEW);
  END IF;

  -- Insert audit log
  INSERT INTO public.financial_audit_log (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    changed_by
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE((NEW.id)::UUID, (OLD.id)::UUID),
    v_action,
    v_old_values,
    v_new_values,
    auth.uid()
  );

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging on financial tables
-- Note: We'll create these triggers after all tables are created
-- This is done in a separate migration to ensure tables exist first
