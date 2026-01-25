-- Migration: Add order field to venerables table for mandate ordering
-- Adiciona campo de ordem para permitir ordenação dos veneráveis por mandato

ALTER TABLE public.venerables
ADD COLUMN IF NOT EXISTS mandate_order INTEGER DEFAULT 0;

-- Criar índice para melhor performance na ordenação
CREATE INDEX IF NOT EXISTS idx_venerables_mandate_order ON public.venerables(mandate_order);

-- Atualizar ordem existente baseada no período (mais recente primeiro)
-- Extrai o ano final do período (ex: "2022 - 2024" -> 2024)
UPDATE public.venerables
SET mandate_order = (
  CASE 
    WHEN period ~ '\d{4}' THEN
      CAST(
        (regexp_match(period, '\d{4}'))[array_length(regexp_match(period, '\d{4}'), 1)] AS INTEGER
      )
    ELSE 0
  END
)
WHERE mandate_order = 0 OR mandate_order IS NULL;

COMMENT ON COLUMN public.venerables.mandate_order IS 'Ordem de exibição dos veneráveis por mandato (maior número = mais recente)';
