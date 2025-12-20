ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#1e293b';
