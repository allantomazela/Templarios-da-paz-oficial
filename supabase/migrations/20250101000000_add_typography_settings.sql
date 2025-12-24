-- Adicionar campos de tipografia avançada
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS typography_letter_spacing TEXT DEFAULT '0.01em',
ADD COLUMN IF NOT EXISTS typography_line_height TEXT DEFAULT '1.75',
ADD COLUMN IF NOT EXISTS typography_font_weight_base TEXT DEFAULT '400',
ADD COLUMN IF NOT EXISTS typography_font_weight_bold TEXT DEFAULT '700',
ADD COLUMN IF NOT EXISTS typography_font_size_base TEXT DEFAULT '16px',
ADD COLUMN IF NOT EXISTS typography_text_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS typography_text_color_muted TEXT DEFAULT '#94a3b8',
ADD COLUMN IF NOT EXISTS typography_text_transform TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS typography_text_decoration TEXT DEFAULT 'none';

