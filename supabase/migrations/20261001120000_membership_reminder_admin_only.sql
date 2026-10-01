-- Configurações de lembrete de mensalidade: somente administradores podem alterar.
-- Demais campos de site_settings continuam editáveis por admin/editor (policy existente).
-- Chamadas sem usuário autenticado (service role, migrations) não são bloqueadas.

CREATE OR REPLACE FUNCTION public.guard_membership_reminder_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.membership_reminder_enabled IS DISTINCT FROM OLD.membership_reminder_enabled
    OR NEW.membership_reminder_frequency IS DISTINCT FROM OLD.membership_reminder_frequency
    OR NEW.membership_reminder_days IS DISTINCT FROM OLD.membership_reminder_days
  THEN
    RAISE EXCEPTION 'Somente administradores podem alterar os lembretes de mensalidade.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_membership_reminder_settings ON public.site_settings;
CREATE TRIGGER guard_membership_reminder_settings
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_membership_reminder_settings();

COMMENT ON FUNCTION public.guard_membership_reminder_settings IS
  'Bloqueia alteração de membership_reminder_* por quem não é administrador.';
