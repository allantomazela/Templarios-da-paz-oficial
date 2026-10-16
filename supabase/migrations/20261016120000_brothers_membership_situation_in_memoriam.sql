-- Inclui "in_memoriam" na situação cadastral do irmão (Secretaria / cobrança / acesso).
ALTER TABLE public.brothers
  DROP CONSTRAINT IF EXISTS brothers_membership_situation_check;

ALTER TABLE public.brothers
  ADD CONSTRAINT brothers_membership_situation_check
  CHECK (
    membership_situation = ANY (
      ARRAY[
        'regular'::text,
        'afastado'::text,
        'desligado'::text,
        'in_memoriam'::text
      ]
    )
  );
