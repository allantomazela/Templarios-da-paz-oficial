-- Chancelaria: Mestre de Banquete pode gerir sessões; RLS alinhado ao frontend;
-- check-in só em session_records com status Pendente (sessão aberta).

CREATE OR REPLACE FUNCTION public.can_manage_chancellor_data(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role IN ('admin', 'editor')
  )
  OR public.has_module_permission(p_user_id, 'chancellor');
$$;

COMMENT ON FUNCTION public.can_manage_chancellor_data(UUID) IS
  'Admin/editor ou cargo com módulo chancellor (Chanceler, Mestre de Banquete, VM).';

-- Mestre de Banquete também acessa chancelaria (abrir sessão / presença)
CREATE OR REPLACE FUNCTION public.has_module_permission(
  p_user_id UUID,
  p_module TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_position public.lodge_position_type;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND email = 'allantomazela@gmail.com'
  ) THEN
    RETURN TRUE;
  END IF;

  v_position := public.get_user_current_position(p_user_id);

  IF v_position IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_position = 'veneravel_mestre' THEN
    RETURN TRUE;
  END IF;

  CASE v_position
    WHEN 'secretario' THEN
      RETURN p_module IN ('secretariat', 'agenda', 'library', 'agape');
    WHEN 'chanceler' THEN
      RETURN p_module IN ('chancellor', 'agenda', 'agape');
    WHEN 'tesoureiro' THEN
      RETURN p_module IN ('financial', 'agape');
    WHEN 'orador' THEN
      RETURN p_module IN ('reports', 'agape');
    WHEN 'mestre_banquete' THEN
      RETURN p_module IN ('chancellor', 'agenda', 'events', 'agape');
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

-- events
DROP POLICY IF EXISTS "Admins and Editors can manage events" ON public.events;
CREATE POLICY "Chancellor module can manage events"
  ON public.events FOR ALL
  TO authenticated
  USING (public.can_manage_chancellor_data(auth.uid()))
  WITH CHECK (public.can_manage_chancellor_data(auth.uid()));

-- session_records
DROP POLICY IF EXISTS "Admins and Editors can manage session_records" ON public.session_records;
CREATE POLICY "Chancellor module can manage session_records"
  ON public.session_records FOR ALL
  TO authenticated
  USING (public.can_manage_chancellor_data(auth.uid()))
  WITH CHECK (public.can_manage_chancellor_data(auth.uid()));

-- attendance (gestão manual pelo chanceler; check-in próprio permanece)
DROP POLICY IF EXISTS "Admins and Editors can manage attendance" ON public.attendance;
CREATE POLICY "Chancellor module can manage attendance"
  ON public.attendance FOR ALL
  TO authenticated
  USING (public.can_manage_chancellor_data(auth.uid()))
  WITH CHECK (public.can_manage_chancellor_data(auth.uid()));

-- checkin_tokens (leitura/gestão)
DROP POLICY IF EXISTS "Admins and Editors can manage checkin_tokens" ON public.checkin_tokens;
CREATE POLICY "Chancellor module can manage checkin_tokens"
  ON public.checkin_tokens FOR ALL
  TO authenticated
  USING (public.can_manage_chancellor_data(auth.uid()))
  WITH CHECK (public.can_manage_chancellor_data(auth.uid()));

-- Só sessões explicitamente abertas (Pendente) aceitam check-in automático
CREATE OR REPLACE FUNCTION public.get_open_session_for_checkin()
RETURNS TABLE (
  session_record_id UUID,
  event_id UUID,
  event_date DATE,
  event_time TIME WITHOUT TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ;
  v_open_minutes INTEGER;
  v_close_minutes_after INTEGER := 240;
BEGIN
  v_now := timezone('utc'::text, now());

  SELECT COALESCE(checkin_open_minutes_before, 30)
  INTO v_open_minutes
  FROM public.site_settings
  WHERE id = 1;

  IF v_open_minutes IS NULL THEN
    v_open_minutes := 30;
  END IF;

  RETURN QUERY
  SELECT
    sr.id AS session_record_id,
    e.id AS event_id,
    e.date AS event_date,
    e.time AS event_time
  FROM public.session_records sr
  JOIN public.events e ON e.id = sr.event_id
  WHERE sr.status = 'Pendente'
    AND v_now BETWEEN
      (timezone('utc'::text, (e.date + e.time))) - (v_open_minutes || ' minutes')::interval
      AND
      (timezone('utc'::text, (e.date + e.time))) + (v_close_minutes_after || ' minutes')::interval
  ORDER BY
    ABS(EXTRACT(EPOCH FROM (timezone('utc'::text, (e.date + e.time)) - v_now)))
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_open_session_for_checkin() IS
  'Retorna session_record Pendente na janela de check-in (sessão aberta pelo Chanceler/Mestre de Banquete).';
