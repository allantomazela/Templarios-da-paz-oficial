-- Add audit fields to visitor attendances
ALTER TABLE public.visitor_attendances
  ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();

ALTER TABLE public.visitor_attendances
  ADD CONSTRAINT visitor_attendances_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_visitor_attendances_created_by
  ON public.visitor_attendances(created_by);
