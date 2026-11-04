-- Data a partir da qual a mensalidade passa a ser cobrada (mês civil da data).
ALTER TABLE public.brothers
  ADD COLUMN IF NOT EXISTS membership_dues_start_date date;

COMMENT ON COLUMN public.brothers.membership_dues_start_date IS
  'Início da cobrança de mensalidade. O primeiro mês cobrado é o mês civil desta data (ex.: 04/11/2026 → Novembro/2026). NULL = regra antiga (conta / lançamentos).';
