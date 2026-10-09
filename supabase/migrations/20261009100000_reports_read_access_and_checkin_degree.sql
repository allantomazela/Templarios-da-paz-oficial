-- 1) Módulo de relatórios (Orador): leitura do quadro, das sessões e das presenças
--    para gerar o relatório do GOB. Somente leitura; a edição continua com o Chanceler.

CREATE OR REPLACE FUNCTION public.get_chancellor_brothers()
RETURNS TABLE(
  id uuid,
  name text,
  profile_id uuid,
  degree text,
  role text,
  status text,
  email text,
  initiation_date date,
  elevation_date date,
  exaltation_date date,
  attendance_rate integer,
  membership_situation text,
  cim text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    b.id, b.name, b.profile_id, b.degree, b.role, b.status, b.email,
    b.initiation_date, b.elevation_date, b.exaltation_date, b.attendance_rate,
    b.membership_situation, b.cim
  FROM public.brothers b
  WHERE (SELECT public.can_manage_chancellor_data((SELECT auth.uid())))
     OR (SELECT public.can_manage_secretariat((SELECT auth.uid())))
     OR (SELECT public.has_module_permission((SELECT auth.uid()), 'reports'))
     OR public.is_own_brother_row(b)
  ORDER BY b.name;
$function$;

DROP POLICY IF EXISTS "Reports module can read session_records" ON public.session_records;
CREATE POLICY "Reports module can read session_records"
  ON public.session_records
  FOR SELECT
  TO authenticated
  USING ((SELECT public.has_module_permission((SELECT auth.uid()), 'reports')));

DROP POLICY IF EXISTS "Reports module can read attendance" ON public.attendance;
CREATE POLICY "Reports module can read attendance"
  ON public.attendance
  FOR SELECT
  TO authenticated
  USING ((SELECT public.has_module_permission((SELECT auth.uid()), 'reports')));

-- 2) Check-in por QR respeita o grau da sessão (events.degree).
--    Sessão sem grau: liberada para todos. Lançamento manual do Chanceler não é afetado
--    (policy "Chancellor module can manage attendance").

CREATE OR REPLACE FUNCTION public.masonic_degree_rank(p_degree text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  SELECT CASE p_degree
    WHEN 'Aprendiz' THEN 1
    WHEN 'Companheiro' THEN 2
    WHEN 'Mestre' THEN 3
    ELSE 0
  END;
$function$;

CREATE OR REPLACE FUNCTION public.can_checkin_session_degree(
  p_user_id uuid,
  p_session_record_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_session_degree text;
  v_user_degree text;
BEGIN
  SELECT e.degree
    INTO v_session_degree
    FROM public.session_records sr
    JOIN public.events e ON e.id = sr.event_id
   WHERE sr.id = p_session_record_id;

  IF v_session_degree IS NULL THEN
    RETURN TRUE;
  END IF;

  SELECT COALESCE(b.degree, p.masonic_degree)
    INTO v_user_degree
    FROM public.profiles p
    LEFT JOIN public.brothers b ON b.profile_id = p.id
   WHERE p.id = p_user_id
   LIMIT 1;

  RETURN public.masonic_degree_rank(v_user_degree)
      >= public.masonic_degree_rank(v_session_degree);
END;
$function$;

REVOKE ALL ON FUNCTION public.can_checkin_session_degree(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_checkin_session_degree(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Authenticated can insert own attendance for QR check-in" ON public.attendance;
CREATE POLICY "Authenticated can insert own attendance for QR check-in"
  ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = brother_id
    AND public.can_checkin_session_degree((SELECT auth.uid()), session_record_id)
  );
