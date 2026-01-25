-- Create visitor attendances table for chancellor module
CREATE TABLE IF NOT EXISTS public.visitor_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_record_id UUID NOT NULL,
  name TEXT NOT NULL,
  degree TEXT NOT NULL,
  lodge TEXT NOT NULL,
  lodge_number TEXT NOT NULL,
  obedience TEXT NOT NULL,
  masonic_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_visitor_attendances_session
  ON public.visitor_attendances(session_record_id);

CREATE INDEX IF NOT EXISTS idx_visitor_attendances_name
  ON public.visitor_attendances(name);

ALTER TABLE public.visitor_attendances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and Editors can view visitor attendances" ON public.visitor_attendances;
DROP POLICY IF EXISTS "Admins and Editors can insert visitor attendances" ON public.visitor_attendances;
DROP POLICY IF EXISTS "Admins and Editors can update visitor attendances" ON public.visitor_attendances;
DROP POLICY IF EXISTS "Admins and Editors can delete visitor attendances" ON public.visitor_attendances;

CREATE POLICY "Admins and Editors can view visitor attendances"
  ON public.visitor_attendances FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

CREATE POLICY "Admins and Editors can insert visitor attendances"
  ON public.visitor_attendances FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

CREATE POLICY "Admins and Editors can update visitor attendances"
  ON public.visitor_attendances FOR UPDATE
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

CREATE POLICY "Admins and Editors can delete visitor attendances"
  ON public.visitor_attendances FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );
