-- Janela do check-in no horário de Brasília: events.date + events.time é horário local da loja,
-- não UTC. Abre N minutos antes (site_settings.checkin_open_minutes_before, padrão 30) e
-- fecha 240 minutos depois do início da sessão.
CREATE OR REPLACE FUNCTION public.get_open_session_for_checkin()
RETURNS TABLE(session_record_id uuid, event_id uuid, event_date date, event_time time without time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_open_minutes INTEGER;
  v_close_minutes_after INTEGER := 240;
BEGIN
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
      ((e.date + e.time) AT TIME ZONE 'America/Sao_Paulo') - make_interval(mins => v_open_minutes)
      AND
      ((e.date + e.time) AT TIME ZONE 'America/Sao_Paulo') + make_interval(mins => v_close_minutes_after)
  ORDER BY
    ABS(EXTRACT(EPOCH FROM (((e.date + e.time) AT TIME ZONE 'America/Sao_Paulo') - v_now)))
  LIMIT 1;
END;
$function$;
