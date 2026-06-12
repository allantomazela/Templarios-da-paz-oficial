-- Separa CIM do número de registro maçônico na tabela brothers.

ALTER TABLE public.brothers ADD COLUMN IF NOT EXISTS cim TEXT;

COMMENT ON COLUMN public.brothers.cim IS 'Cadastro de Identificação Maçônica (CIM)';
COMMENT ON COLUMN public.brothers.masonic_registration_number IS 'Número de registro maçônico (distinto do CIM)';

-- Legado: o formulário rotulava o CIM como "Número de Registro Maçônico".
UPDATE public.brothers
SET cim = masonic_registration_number
WHERE cim IS NULL
  AND masonic_registration_number IS NOT NULL
  AND trim(masonic_registration_number) <> '';
