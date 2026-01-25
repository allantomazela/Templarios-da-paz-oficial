-- Improve announcements ordering performance
CREATE INDEX IF NOT EXISTS idx_announcements_created_at
  ON public.announcements(created_at DESC);
