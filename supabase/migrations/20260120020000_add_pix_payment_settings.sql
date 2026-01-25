-- Migration: Add PIX payment settings for Ágape
-- Adiciona configurações de PIX e tipo de pagamento para o sistema de ágape

ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS agape_pix_key TEXT,
ADD COLUMN IF NOT EXISTS agape_pix_name TEXT,
ADD COLUMN IF NOT EXISTS agape_payment_type TEXT DEFAULT 'monthly' CHECK (agape_payment_type IN ('monthly', 'per_session'));

COMMENT ON COLUMN public.site_settings.agape_pix_key IS 'Chave PIX para pagamento do ágape';
COMMENT ON COLUMN public.site_settings.agape_pix_name IS 'Nome do beneficiário da chave PIX';
COMMENT ON COLUMN public.site_settings.agape_payment_type IS 'Tipo de pagamento: monthly (mensal) ou per_session (por ágape)';
