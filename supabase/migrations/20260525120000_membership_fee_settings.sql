-- Configurações de mensalidade da loja (valor padrão e dia de vencimento)

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS membership_fee_amount NUMERIC(10, 2) DEFAULT 150.00
    CHECK (membership_fee_amount > 0),
  ADD COLUMN IF NOT EXISTS membership_fee_due_day INTEGER DEFAULT 10
    CHECK (membership_fee_due_day >= 1 AND membership_fee_due_day <= 28);

COMMENT ON COLUMN public.site_settings.membership_fee_amount IS 'Valor padrão da mensalidade (R$) para novos lançamentos e geração em lote';
COMMENT ON COLUMN public.site_settings.membership_fee_due_day IS 'Dia do mês considerado vencimento da mensalidade (1-28)';
