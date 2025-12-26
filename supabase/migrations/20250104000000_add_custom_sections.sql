-- Adicionar campo custom_sections na tabela site_settings
-- Este campo armazena seções customizadas da homepage em formato JSON

ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN public.site_settings.custom_sections IS 'Array de seções customizadas da homepage. Cada seção contém: id, title, content, type, order, visible, backgroundColor, textColor';

-- Criar índice GIN para melhor performance em consultas JSONB
CREATE INDEX IF NOT EXISTS idx_site_settings_custom_sections 
ON public.site_settings USING GIN (custom_sections);

