-- Novos cargos na atribuição da diretoria da loja.

ALTER TYPE public.lodge_position_type ADD VALUE IF NOT EXISTS 'primeiro_vigilante';
ALTER TYPE public.lodge_position_type ADD VALUE IF NOT EXISTS 'segundo_vigilante';
ALTER TYPE public.lodge_position_type ADD VALUE IF NOT EXISTS 'mestre_cerimonias';
ALTER TYPE public.lodge_position_type ADD VALUE IF NOT EXISTS 'mestre_harmonia';
