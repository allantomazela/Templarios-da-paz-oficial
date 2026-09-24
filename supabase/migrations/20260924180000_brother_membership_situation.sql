-- Situação operacional do irmão (cobrança + acesso) e valores de mensalidade compostos.

ALTER TABLE public.brothers
  ADD COLUMN IF NOT EXISTS membership_situation TEXT NOT NULL DEFAULT 'regular';

ALTER TABLE public.brothers
  DROP CONSTRAINT IF EXISTS brothers_membership_situation_check;

ALTER TABLE public.brothers
  ADD CONSTRAINT brothers_membership_situation_check
  CHECK (membership_situation IN ('regular', 'afastado', 'desligado'));

COMMENT ON COLUMN public.brothers.membership_situation IS
  'regular = cobrança completa e acesso; afastado = só mensalidade base e acesso; desligado = sem cobrança e sem acesso';

UPDATE public.brothers
SET membership_situation = 'desligado'
WHERE status = 'Inativo'
  AND membership_situation = 'regular';

UPDATE public.brothers
SET membership_situation = 'afastado'
WHERE status = 'Ativo'
  AND membership_situation = 'regular'
  AND lower(trim(COALESCE(regular_status, ''))) = 'afastado';

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS membership_fee_base_amount NUMERIC(10, 2) DEFAULT 200
    CHECK (membership_fee_base_amount IS NULL OR membership_fee_base_amount > 0),
  ADD COLUMN IF NOT EXISTS membership_fee_session_package_amount NUMERIC(10, 2) DEFAULT 90
    CHECK (
      membership_fee_session_package_amount IS NULL
      OR membership_fee_session_package_amount >= 0
    );

COMMENT ON COLUMN public.site_settings.membership_fee_base_amount IS
  'Valor da mensalidade pura (R$), usado também para irmãos afastados';
COMMENT ON COLUMN public.site_settings.membership_fee_session_package_amount IS
  'Pacote de sessão embutido (jantares + tronco) somado à base para irmãos regulares';

UPDATE public.site_settings
SET
  membership_fee_base_amount = COALESCE(membership_fee_base_amount, 200),
  membership_fee_session_package_amount = COALESCE(
    membership_fee_session_package_amount,
    90
  ),
  membership_fee_amount = COALESCE(membership_fee_base_amount, 200)
    + COALESCE(membership_fee_session_package_amount, 90)
WHERE id = 1;
