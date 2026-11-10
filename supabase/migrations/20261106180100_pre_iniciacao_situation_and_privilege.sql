-- Situação cadastral distinta do quadro: não gera mensalidade nem entra na chamada padrão.
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
        'in_memoriam'::text,
        'pre_iniciacao'::text
      ]
    )
  );

COMMENT ON COLUMN public.brothers.membership_situation IS
  'regular, afastado, desligado, in_memoriam ou pre_iniciacao (cadastro antes da iniciação).';

-- O próprio usuário não eleva status nem papel da conta.
CREATE OR REPLACE FUNCTION public.prevent_self_privilege_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NEW.id = auth.uid()
     AND NOT public.is_admin_or_editor()
     AND (
       NEW.status IS DISTINCT FROM OLD.status
       OR NEW.role IS DISTINCT FROM OLD.role
     ) THEN
    RAISE EXCEPTION 'Não é permitido alterar o próprio status ou papel'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_self_privilege_change ON public.profiles;
CREATE TRIGGER profiles_prevent_self_privilege_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_privilege_change();
