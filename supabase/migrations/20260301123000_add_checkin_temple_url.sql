-- Adiciona URL configurável para o QR fixo de check-in do Templo.
-- Isso permite alterar o endereço usado no QR (por exemplo, em caso de mudança de domínio
-- ou uso da aplicação por outra Loja), sem necessidade de alterar o código.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS checkin_temple_url TEXT;

COMMENT ON COLUMN public.site_settings.checkin_temple_url IS
'URL base usada para o QR fixo de check-in do Templo (ex.: https://app.minhaloja.com.br/checkin-templo). Se nula, o frontend usa window.location.origin + /checkin-templo.';

