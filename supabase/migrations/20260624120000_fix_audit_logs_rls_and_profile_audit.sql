-- Restaura leitura de audit_logs e amplia auditoria de perfis (gestão de usuários)

CREATE OR REPLACE FUNCTION public.log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id UUID;
  payload JSONB;
BEGIN
  actor_id := auth.uid();

  IF TG_OP = 'UPDATE' THEN
    payload := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    INSERT INTO public.audit_logs (profile_id, action, entity_type, entity_id, details)
    VALUES (actor_id, 'UPDATE', TG_TABLE_NAME, NEW.id::text, payload);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    payload := jsonb_build_object('old', to_jsonb(OLD));
    INSERT INTO public.audit_logs (profile_id, action, entity_type, entity_id, details)
    VALUES (actor_id, 'DELETE', TG_TABLE_NAME, OLD.id::text, payload);
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    payload := jsonb_build_object('new', to_jsonb(NEW));
    INSERT INTO public.audit_logs (profile_id, action, entity_type, entity_id, details)
    VALUES (actor_id, 'CREATE', TG_TABLE_NAME, NEW.id::text, payload);
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (
    OLD.status IS DISTINCT FROM NEW.status
    OR OLD.role IS DISTINCT FROM NEW.role
    OR OLD.masonic_degree IS DISTINCT FROM NEW.masonic_degree
    OR OLD.full_name IS DISTINCT FROM NEW.full_name
    OR OLD.email IS DISTINCT FROM NEW.email
  )
  EXECUTE FUNCTION public.log_changes();

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins and approvers can view audit logs" ON public.audit_logs;

CREATE POLICY "Admins and approvers can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.can_approve_users(auth.uid())
  );

COMMENT ON POLICY "Admins and approvers can view audit logs" ON public.audit_logs IS
  'Administradores e diretoria com permissão de aprovar usuários podem consultar o histórico.';
